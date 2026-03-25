import base64
import json
import os
import pathlib
import re
from sys import modules

__all__ = ["get_project_modules"]

IMPORT_FROM_RE = re.compile(
    r'(?P<prefix>\b(?:import|export)\b[\s\S]*?\bfrom\s*)(?P<quote>["\'])'
    r'(?P<spec>[^"\'\n]+)'
    r'(?P=quote)',
)


# Match side-effect imports: import 'specifier';
SIDE_EFFECT_IMPORT_RE = re.compile(
    r'(?P<prefix>\bimport\s*)(?P<quote>["\'])'
    r'(?P<spec>[^"\'\n]+)'
    r'(?P=quote)',
)

def to_data_uri(js_code):
    payload = base64.b64encode(js_code.encode("utf-8")).decode("utf-8")
    return f"data:text/javascript;base64,{payload}"

def resolve_specifier(specifier, MODULE_ALIASES, current_rel_path):
    if specifier in MODULE_ALIASES:
        return MODULE_ALIASES[specifier]

    if specifier.startswith("./") or specifier.startswith("../"):
        base_dir = os.path.dirname(current_rel_path)
        rel_path = os.path.normpath(os.path.join(base_dir, specifier)).replace("\\", "/")
        if not rel_path.endswith(".js"):
            rel_path = f"{rel_path}.js"
        return rel_path

    return None

def build_module_uri(rel_path, MODULE_ALIASES, ROOT_PATH, cache, stack):
    rel_path = rel_path.replace("\\", "/")
    if rel_path in cache:
        return cache[rel_path]

    if rel_path in stack:
        chain = " -> ".join(stack + [rel_path])
        raise ValueError(f"Circular JS dependency detected: {chain}")

    stack.append(rel_path)
    full_path = os.path.join(ROOT_PATH, rel_path)
    code = pathlib.Path(full_path).read_text()

    def replace_specifier(match):
        prefix = match.group("prefix")
        quote = match.group("quote")
        spec = match.group("spec")
        dep_rel = resolve_specifier(spec, MODULE_ALIASES, rel_path)
        if dep_rel is None:
            return match.group(0)
        dep_uri = build_module_uri(dep_rel, MODULE_ALIASES, ROOT_PATH, cache, stack)
        return f"{prefix}{quote}{dep_uri}{quote}"

    rewritten = IMPORT_FROM_RE.sub(replace_specifier, code)
    rewritten = SIDE_EFFECT_IMPORT_RE.sub(replace_specifier, rewritten)

    uri = to_data_uri(rewritten)
    cache[rel_path] = uri
    stack.pop()
    return uri



def get_project_modules(MODULE_ALIASES, ROOT_PATH):
    module_uri_cache = {}
    proj_modules = {
        alias: build_module_uri(source, MODULE_ALIASES, ROOT_PATH, module_uri_cache, [])
        for alias, source in MODULE_ALIASES.items()
    }
    return proj_modules

# How do I tell python which function is for export?
