# Ross Momentum V1

Independent browser-only paper trading practice dashboard. Chinese interface, fictional symbols, synthetic minute prices, and $25,000 virtual starting cash. No market-data API, brokerage integration, credentials, or real trade execution. Not affiliated with Ross Cameron or Warrior Trading.

## Features
- Momentum scanner and price chart; pause, single step and playback speed.
- Long-only cash trades with $0.01/share entry and exit slippage.
- Risk-based sizing, $5,000 position-cost limit, three-position limit, no duplicate symbol positions.
- Automatic stop/target exits, aggregate remaining-risk cap, equity-loss circuit breaker and forced liquidation.
- Local browser persistence, CSV journal export, explicit session reset.

Risk limits are practice-session limits, not automatic calendar-day resets. Gaps/slippage can exceed planned losses. Prices advance only while the page runs. Closing the browser pauses the simulator. Data lives in localStorage and is not shared across devices. Latest 100 journal rows are shown; CSV includes the complete journal.

## Run / deploy
Serve this directory with any static HTTP server. GitHub Pages: Settings → Pages → Deploy from a branch → main → / (root). No build or dependencies required.

## Automated practice and optional real quotes
The automatic strategy ranks only the configured watchlist, requiring a five-observation closing-price breakout and a configurable five-observation percentage gain. This is a simple practice strategy, not a verified recreation of Ross Cameron's strategy. It shares the existing sizing and loss controls, caps automatic entries at 20/session, uses five-update re-entry cooldowns and a 20-update holding timeout. Stopping automatic mode prevents new entries; ongoing quotes still manage exits. Flatten disables new automatic entries.

Twelve Data mode uses a personal API key entered in the page, stored only in memory. It requests up to four symbols' 1-minute closing prices every 125 seconds, with a browser-local 780-request UTC-day cap. Other applications or browsers can consume the same provider quota. API errors stop automatic entries. Data older than three minutes and prices outside weekday 09:30–16:00 America/New_York cannot open positions. Market holidays are handled by quote-age checks. The feed may have limited exchange coverage or delayed data. Quotes are real; all orders, fills and P&L remain hypothetical with fixed slippage, without bid/ask, liquidity or intrabar execution simulation. Relative volume and float are unavailable and are not fabricated. Percentage change is against the earliest fetched observation, not the previous day's close. The application does not scan the entire US market.

Switching sources explicitly starts a new practice session. Reloads restore records but pause quotes and automation. Reconnecting also starts a new session; existing logs can be exported first. API keys are never included in the repository or localStorage. Free data use is personal/internal, subject to Twelve Data's terms; the static website does not redistribute a shared feed.
