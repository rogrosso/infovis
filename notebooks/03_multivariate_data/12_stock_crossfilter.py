"""
This is a Bokeh app that allows you to visualize the correlation between two stocks. It is a multiplae
linked view of two stocks using crossfilters. 
The app allows you to select two stocks from a list of stocks and then displays their stock prices and returns.
The app also displays a scatter plot of the returns of the two stocks, which allows you to see the correlation between them.
We use the Yahoo finance API to get the stock data: yfinance 0.2.55.
Usage:
    uv run bokeh serve --show 12_stock_crossfilter.py
"""
import yfinance as yf
import pandas as pd
from bokeh.models import ColumnDataSource, Select, PreText
from bokeh.plotting import figure, curdoc, show
from bokeh.layouts import column, row

# Stocks to be used in the app
TICKERS = [
    "AAPL",
    "GOOG",
    "INTC",
    "NVDA",
    "MSFT",
]  # Apple, Google, Intel, Nvidia, Microsoft, Netflix(NFLX), Tesla (TSLA)
# Fixed start and end date
START_DATE = "2022-09-01"
END_DATE = "2024-09-01"

print(f'\nLoading data from Yahoo finance for {TICKERS} from {START_DATE} to {END_DATE}...')
def on_server_loaded(tickers, start_date, end_date):
    print("\nLoading data from Yahoo finance...", end="")
    df = yf.download(tickers, start=start_date, end=end_date, auto_adjust=True, timeout=10, threads=True)
    # df["Returns"] = df["Close"].diff()
    print("DONE!\n")
    return df["Close"]


# Load data from server
df = on_server_loaded(TICKERS, START_DATE, END_DATE)
#print(df.head())


# Filter data for visualization
def filter_data(df, tick1, tick2):
    df_12 = df[[tick1, tick2]]
    rets = df_12.pct_change().add_suffix("_returns")
    df_12 = pd.concat([df_12, rets], axis=1)
    # df_12.rename(columns={tick1: tick1, tick2: tick}, inplace=True)
    return df_12.dropna()


# df_12 = filter_data(df, "AAPL", "GOOG")
# print(df_12.head())

# create data source
source = ColumnDataSource(
    data=dict(date=[], t1=[], t2=[], t1_returns=[], t2_returns=[])
)

# plot correlation: scatter plot of two stocks
corr = figure(
    width=430,
    height=430,
    title="Correlation between two stocks",
    tools="pan, wheel_zoom, box_select, reset",
    active_drag="box_select",
)
corr.scatter(
    "t1_returns",
    "t2_returns",
    source=source,
    size=7,
    color="orange",
    alpha=0.7,
    nonselection_alpha=0.1,
    selection_alpha=0.6,
)
corr.min_border = 5

# plot pandas describe: stats of the two stocks
stats = PreText(text="", width=500, styles={"font-size": "12pt"})

# plot ticker 1
ts1 = figure(
    width=880,
    height=200,
    x_axis_type="datetime",
    tools="pan,wheel_zoom,xbox_select,reset",
    active_drag="xbox_select",
)
ts1.line("Date", "t1", source=source, line_width=2, color="#3333cc", nonselection_alpha=0.5)
ts1.scatter("Date", "t1", size=5, source=source, color=None, selection_color="orange")

# plot ticker 2
ts2 = figure(
    width=880,
    height=200,
    x_axis_type="datetime",
    tools="pan,wheel_zoom,xbox_select,reset",
    active_drag="xbox_select",
)
ts2.line("Date", "t2", source=source, line_width=2, color="#3333cc", nonselection_alpha=0.5)
ts2.scatter("Date", "t2", size=5, source=source, color=None, selection_color="orange")

# crossfilter: set x_range for both plots
ts1.x_range = ts2.x_range


# create select widget
def nix(val, lst):
    return [x for x in lst if x != val]


ticker1 = Select(title="Ticker 1", value="AAPL", options=nix("GOOD", TICKERS))
ticker2 = Select(title="Ticker 2", value="GOOG", options=nix("AAPL", TICKERS))


# widgets callback functions
def ticker1_change(attrname, old, new):
    ticker2.options = nix(new, TICKERS)
    redraw()


def ticker2_change(attrname, old, new):
    ticker1.options = nix(new, TICKERS)
    redraw()


ticker1.on_change("value", ticker1_change)
ticker2.on_change("value", ticker2_change)


def redraw(selected=None):
    t1, t2 = ticker1.value, ticker2.value
    df12 = filter_data(df, t1, t2)
    source.data = dict(
        Date=df12.index,
        t1=df12[t1].values,
        t2=df12[t2].values,
        t1_returns=df12[t1 + "_returns"].values,
        t2_returns=df12[t2 + "_returns"].values,
    )
    corr.title.text = f"{t1} returns vs {t2} returns"
    ts1.title.text = f"{t1} stock price"
    ts2.title.text = f"{t2} stock price"
    stats.text = df12.describe().to_string()


# update the plot
redraw()
widgets = column(row(ticker1, ticker2), stats)
row1 = row(corr, widgets)
col = column(row1, ts1, ts2)
curdoc().add_root(col)
show(row1)
