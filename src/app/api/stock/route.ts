import { NextRequest, NextResponse } from "next/server";

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

async function fetchJSON(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(
        `Fetch error: ${res.status} ${res.statusText} for URL ${url}`
      );
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(
      `Network error fetching ${url}:`,
      error instanceof Error ? error.message : error
    );
    throw error; // Re-throw to preserve original error stack
  }
}

type ChartDataPoint = {
  timestamp: string;
  price: number;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    console.error("Missing symbol parameter in request");
    return new NextResponse(JSON.stringify({ error: "Symbol is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    console.log(`Starting stock data fetch for ${symbol}`);

    // Finnhub API URLs
    // Polygon API URLs
    const quoteUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`;
    console.log(
      `Fetching Polygon quote: ${quoteUrl.replace(POLYGON_API_KEY!, "***")}`
    );

    const companyProfileUrl = `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${POLYGON_API_KEY}`;
    console.log(
      `Fetching Polygon profile: ${companyProfileUrl.replace(
        POLYGON_API_KEY!,
        "***"
      )}`
    );

    const companyMetricsUrl = `https://api.polygon.io/vX/reference/financials?ticker=${symbol}&timeframe=annual&apiKey=${POLYGON_API_KEY}`;
    console.log(
      `Fetching Polygon metrics: ${companyMetricsUrl.replace(
        POLYGON_API_KEY!,
        "***"
      )}`
    );

    // Alpha Vantage intraday data URL
    const alphaVantageUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    console.log(
      `Fetching Alpha Vantage data: ${alphaVantageUrl.replace(
        ALPHA_VANTAGE_API_KEY!,
        "***"
      )}`
    );

    // Add individual API timeouts
    const API_TIMEOUT = 8000; // 8 seconds

    const fetchWithTimeout = async (url: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (error) {
        console.error(
          `Timeout or network error for ${url}:`,
          error instanceof Error ? error.message : error
        );
        throw error;
      }
    };

    // Test APIs sequentially to identify which one is failing
    console.log("Testing Finnhub quote API...");
    const quoteData = await fetchWithTimeout(quoteUrl).catch((e) => {
      console.error("Finnhub quote API failed");
      throw e;
    });

    console.log("Testing Polygon profile API...");
    const stockProfileData = await fetchWithTimeout(companyProfileUrl).catch((e) => {
      console.error("Polygon profile API failed");
      throw e;
    });

    const [companyMetricsData, alphaVantageData] = await Promise.all([
      fetchJSON(companyMetricsUrl),
      fetchJSON(alphaVantageUrl),
    ]);

    console.log("Finnhub quote response:", quoteData);
    console.log("Finnhub profile response:", stockProfileData);
    console.log("Finnhub metrics response:", companyMetricsData);
    console.log("Alpha Vantage response:", alphaVantageData);

    if (
      !quoteData?.results?.[0]?.c || 
      !stockProfileData?.results?.name ||
      !companyMetricsData?.results?.[0]?.financials
    ) {
      console.error("Missing required data fields");
      return new NextResponse(
        JSON.stringify({
          error: "Incomplete stock data",
          details: {
            quote: !!quoteData,
            profile: !!stockProfileData,
            metrics: !!companyMetricsData,
          },
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let chartData: ChartDataPoint[] = [];
    if (alphaVantageData && alphaVantageData["Time Series (Daily)"]) {
      const dailyRawData = alphaVantageData["Time Series (Daily)"];
      chartData = Object.keys(dailyRawData).map((timestamp) => ({
        timestamp: new Date(timestamp).toISOString(),
        price: parseFloat(dailyRawData[timestamp]["4. close"]),
      }));
    }

    if (alphaVantageData && alphaVantageData["Time Series (Daily)"]) {
      console.log(`Processed ${chartData.length} Alpha Vantage data points`);
    } else {
      console.warn("No Alpha Vantage daily data found");
    }

    const structData = {
      companyName: stockProfileData.results.name,
      ticker: symbol,
      exchange: stockProfileData.results.primary_exchange,
      currentPrice: quoteData.results[0].c,
      change: {
        amount: parseFloat((quoteData.results[0].c - quoteData.results[0].o).toFixed(2)),
        percentage: parseFloat(
          (((quoteData.results[0].c - quoteData.results[0].o) / quoteData.results[0].o) * 100).toFixed(2)
        ),
      },
      chartData,
      open: quoteData.results[0].o,
      high: quoteData.results[0].h,
      low: quoteData.results[0].l,
      previousClose: quoteData.results[0].c,
      marketCap: companyMetricsData.results[0].market_cap,
      peRatio: companyMetricsData.results[0].pe_ratio,
      dividendYield: `${(companyMetricsData.results[0].dividend_yield * 100).toFixed(2)}%`,
      high52Week: companyMetricsData.results[0].high_52_week,
      low52Week: companyMetricsData.results[0].low_52_week,
    };

    console.log("Successfully processed all data");
    return new NextResponse(JSON.stringify(structData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(
      "Critical path error:",
      error instanceof Error ? error.stack : error
    );
    return new NextResponse(
      JSON.stringify({
        error: "Failed to fetch stock data",
        debug: {
          symbol,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
