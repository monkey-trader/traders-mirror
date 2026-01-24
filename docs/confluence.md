# Confluence Wizard Options

This document lists the Confluence options available in the Confluence Wizard used when annotating analysis timeframes.

- 50% Wick — Hinweise auf Kerzenkörper/Wicks-Verhältnisse.
- 50 EMA — 50-period exponential moving average.
- 200 EMA — 200-period exponential moving average.
- FVG — Fair Value Gap (Marktlücke / imbalance).
- Liquidität cluster — Cluster von Liquiditätsleveln (Orderflow-relevant).
- Bärische Divergenzen — Bearish divergences (z.B. RSI/price divergence indicating potential downside).
- Bullische Divergenzen — Bullish divergences (e.g. RSI/price divergence indicating potential upside).

Zusätzlich verfügbare ("Weitere Confluence") Optionen:

- CME Close — special session close behavior for futures.
- Doppelter Vorteil — pattern/edge identified as "double advantage".
- Einzelne Liq. Level — single liquidity levels (manually annotated).

Usage:
- Open the Confluence Wizard from the Analysis modal.
- Select a timeframe (Monthly, Weekly, Daily, 4H, 2H, 1H).
- Tick any applicable Confluence options and save per timeframe.
- The aggregated selections are attached to the analysis and can be used to prefill trades or for reporting.

Notes:
- Option labels are currently hardcoded in `src/presentation/confluenceWizard/ConfluenceWizard.tsx`.
- If you need translations/localization, we can extract these labels into a translation file and wire a small i18n helper.
