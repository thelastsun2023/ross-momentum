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
