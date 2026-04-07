import sys
import pathlib
import importlib 
import json
import os

import anywidget
import traitlets

__all__ = ["MyClassicD3Widget"]

# -----------------------------------------------------------------------------
# 1) Paths and static assets
# -----------------------------------------------------------------------------
ROOT_PATH = os.getcwd().split("notebooks")[0]
CSS_PATH = os.path.join(ROOT_PATH, "css", "lectures.css")
widget_css = pathlib.Path(CSS_PATH).read_text()

# -----------------------------------------------------------------------------
# 2) Import engine for get JavaScript ESM6 modules
# -----------------------------------------------------------------------------
# 1. Path logic 
root = str(pathlib.Path.cwd().parent.absolute())
if root not in sys.path: sys.path.append(root)
# 2. Imports
import vis_engine
importlib.reload(vis_engine) # For your debugging 
get_project_modules = vis_engine.get_project_modules
MODULE_ALIASES = vis_engine.MODULE_ALIASES
# -----------------------------------------------------------------------------
# 3) Module resolution for browser-safe Data URI imports
# -----------------------------------------------------------------------------
# Map project aliases to source files.
MODULE_ALIASES["forcedirectedlayout"] = "04_networks/visualization/forcedirectedlayout.js"
MODULE_ALIASES["layoutPhysics"] = "04_networks/visualization/layoutPhysics.js"

proj_modules = get_project_modules(MODULE_ALIASES, ROOT_PATH)

js_logic = """
export async function render({ model, el }) {
    // set background color for the widget
    el.style.backgroundColor = 'transparent'
    
    // import the module for drawing the force-directed layout
    const moduleUri = model.get('forcedirectedlayout_uri')
    const { drawAll } = await import(moduleUri);
    
    // create div for canvas and draw
    const divElement = document.createElement("div")
    
    // set class and id for styling and selection
    divElement.setAttribute('class', 'canvas grid-container-1-column')
    divElement.setAttribute('id', 'force-directed-layout')
    divElement.style.textAlign = 'center'

    // append to anywidget element
    el.appendChild(divElement);

    const lesmiserables = model.get('network_data')
    drawAll('#force-directed-layout', lesmiserables);
}
"""

# -----------------------------------------------------------------------------
# 4) Data + widget model
# -----------------------------------------------------------------------------
network_path = pathlib.Path(ROOT_PATH) / "data" / "lesmiserables.json"
with open(network_path, "r") as f:
    initial_data = json.load(f)

class MyClassicD3Widget(anywidget.AnyWidget):
    network_data = traitlets.Dict(initial_data).tag(sync=True)
    forcedirectedlayout_uri = traitlets.Unicode(
        proj_modules["forcedirectedlayout"]
    ).tag(sync=True)
    _css = CSS_PATH
    _esm = js_logic