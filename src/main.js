import { WebR } from "webr";
import "./style.css";

const demoCsv = `substrate_concentration,initial_rate
0.2,0.31
0.4,0.49
0.7,0.68
1.0,0.82
1.5,0.98
2.0,1.08
3.0,1.21
5.0,1.34`;

const app = document.querySelector("#app");
let data = [];
let webR;

app.innerHTML = `
  <header class="topbar">
    <a class="brand" href="#" aria-label="EnzymeFit home">
      <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
      <span>enzyme<span class="brand-accent">fit</span></span>
    </a>
    <span class="topbar-note"><span class="live-dot"></span> Private, in-browser analysis</span>
  </header>

  <main>
    <section class="intro">
      <div class="eyebrow"><span class="eyebrow-line"></span> ENZYME KINETICS WORKSPACE</div>
      <h1>Make sense of<br /><span>what your enzyme does.</span></h1>
      <p class="intro-copy">Fit your initial-rate data to the Michaelis–Menten model. Your analysis runs right here in your browser—your data never leaves this page.</p>
    </section>

    <section class="workspace" aria-label="Enzyme kinetics analysis">
      <div class="panel input-panel">
        <div class="panel-heading">
          <div class="step-number">01</div>
          <div>
            <h2>Your data</h2>
            <p>Upload a CSV or try the example dataset.</p>
          </div>
        </div>

        <label class="upload-zone" for="csv-file">
          <span class="upload-icon" aria-hidden="true">↑</span>
          <span class="upload-title">Choose a CSV file</span>
          <span class="upload-hint" id="upload-hint">or drag it here · .csv</span>
          <input id="csv-file" type="file" accept=".csv,text/csv" />
        </label>

        <div class="or-divider"><span>OR</span></div>
        <button class="text-button" id="load-example" type="button">Load example dataset <span aria-hidden="true">↗</span></button>

        <div class="data-fields">
          <label>
            <span>Substrate unit</span>
            <input id="substrate-unit" type="text" value="mM" maxlength="24" />
          </label>
          <label>
            <span>Rate unit</span>
            <input id="rate-unit" type="text" value="μmol/min" maxlength="24" />
          </label>
        </div>

        <div class="data-preview" id="data-preview">
          <div class="preview-title"><span>DATA PREVIEW</span><span id="row-count">No data loaded</span></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Substrate</th><th>Initial rate</th></tr></thead>
              <tbody id="data-rows"><tr><td class="empty-cell" colspan="2">Load data to see a preview</td></tr></tbody>
            </table>
          </div>
        </div>

        <button class="fit-button" id="fit-button" type="button" disabled>
          <span id="fit-label">Fit Michaelis–Menten model</span><span aria-hidden="true">→</span>
        </button>
        <p class="status-message" id="status-message" role="status" aria-live="polite"></p>
      </div>

      <div class="panel results-panel">
        <div class="panel-heading results-heading">
          <div class="step-number">02</div>
          <div>
            <h2>Your results</h2>
            <p>Nonlinear regression, calculated with R via webR.</p>
          </div>
          <span class="model-tag"><span class="live-dot"></span> MM MODEL</span>
        </div>

        <div class="chart-card" id="chart-card">
          <div class="chart-placeholder" id="chart-placeholder">
            <div class="placeholder-graphic" aria-hidden="true">
              <svg viewBox="0 0 320 150" role="presentation">
                <path d="M37 18v108h255" />
                <path class="placeholder-curve" d="M40 118c40-10 48-78 102-88s101 0 147-1" />
                <circle cx="65" cy="93" r="4" /><circle cx="105" cy="58" r="4" /><circle cx="151" cy="42" r="4" /><circle cx="205" cy="34" r="4" /><circle cx="266" cy="31" r="4" />
              </svg>
            </div>
            <strong>Your fitted curve will appear here</strong>
            <span>Load your data and run the model to get started.</span>
          </div>
          <div class="chart-content hidden" id="chart-content">
            <div class="chart-legend"><span><i class="legend-dot"></i> Observed</span><span><i class="legend-line"></i> Michaelis–Menten fit</span></div>
            <div id="chart-container"></div>
          </div>
        </div>

        <div class="parameter-grid" aria-live="polite">
          <article class="parameter-card">
            <div class="parameter-label"><span>V<sub>max</sub></span><span class="parameter-info" title="Maximum reaction rate">i</span></div>
            <div class="parameter-value" id="vmax-value">—</div>
            <div class="parameter-unit" id="vmax-unit">Maximum rate</div>
          </article>
          <article class="parameter-card">
            <div class="parameter-label"><span>K<sub>m</sub></span><span class="parameter-info" title="Substrate concentration at half Vmax">i</span></div>
            <div class="parameter-value" id="km-value">—</div>
            <div class="parameter-unit" id="km-unit">Half-max concentration</div>
          </article>
          <article class="parameter-card goodness-card">
            <div class="parameter-label"><span>R<sup>2</sup></span><span class="parameter-info" title="Coefficient of determination">i</span></div>
            <div class="parameter-value" id="r2-value">—</div>
            <div class="parameter-unit">Goodness of fit</div>
          </article>
        </div>
        <p class="formula">v = <span>V<sub>max</sub> [S]</span> / (K<sub>m</sub> + [S])</p>
      </div>
    </section>

    <footer><span>ENZYMEFIT</span><span>Built for clear, reproducible science.</span><span>One enzyme · One dataset · No data upload</span></footer>
  </main>
`;

const fileInput = document.querySelector("#csv-file");
const fitButton = document.querySelector("#fit-button");
const fitLabel = document.querySelector("#fit-label");
const statusMessage = document.querySelector("#status-message");
const uploadTitle = document.querySelector(".upload-title");
const uploadHint = document.querySelector("#upload-hint");

document.querySelector("#load-example").addEventListener("click", () => {
  try {
    setData(parseCsv(demoCsv), "Example dataset");
    setStatus("Example data loaded. Ready to fit.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
});

fileInput.addEventListener("change", async (event) => {
  const [file] = event.currentTarget.files ?? [];
  if (!file) return;
  await loadFile(file);
  fileInput.value = "";
});

const uploadZone = document.querySelector(".upload-zone");
for (const eventName of ["dragenter", "dragover"]) {
  uploadZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadZone.classList.add("dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  uploadZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadZone.classList.remove("dragging");
  });
}
uploadZone.addEventListener("drop", async (event) => {
  const [file] = event.dataTransfer?.files ?? [];
  if (!file) return;
  await loadFile(file);
});

async function loadFile(file) {
  try {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      throw new Error("Please choose a .csv file.");
    }
    const measurements = parseCsv(await file.text());
    setData(measurements, file.name);
    setStatus(`${file.name} loaded (${measurements.length} rows). Ready to fit.`, "success");
  } catch (error) {
    clearData();
    setStatus(error.message, "error");
  }
}

fitButton.addEventListener("click", async () => {
  if (!data.length) return;
  setBusy(true);
  setStatus("Starting browser-based R…", "pending");
  try {
    webR ??= new WebR();
    await webR.init();
    setStatus("Fitting the nonlinear model…", "pending");
    const result = await fitMichaelisMenten(data);
    renderResults(result);
    setStatus("Fit complete. The model was calculated locally in your browser.", "success");
  } catch (error) {
    setStatus(`The model could not be fitted: ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
});

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field.trim());
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i += 1;
      row.push(field.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error("The CSV contains an unclosed quoted field.");
  row.push(field.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  if (rows.length < 2) throw new Error("The CSV needs a header row and at least three measurements.");

  const headers = rows[0].map((header) =>
    header
      .toLowerCase()
      .replace(/\([^)]*\)|\[[^\]]*\]/g, "")
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, ""),
  );
  const substrateIndex = headers.findIndex((header) =>
    ["substrate", "substrate_concentration", "concentration", "s", "s_mm"].includes(header),
  );
  const rateIndex = headers.findIndex((header) =>
    ["rate", "initial_rate", "initial_reaction_rate", "reaction_rate", "rate_umol_min", "v0", "velocity", "initial_velocity"].includes(header),
  );
  if (substrateIndex < 0 || rateIndex < 0 || substrateIndex === rateIndex) {
    throw new Error("Add columns named substrate_concentration and initial_rate (or substrate and rate).");
  }

  const measurements = rows.slice(1).map((cells, index) => {
    const substrate = Number(cells[substrateIndex]);
    const rate = Number(cells[rateIndex]);
    if (!cells[substrateIndex] || !cells[rateIndex] || !Number.isFinite(substrate) || !Number.isFinite(rate)) {
      throw new Error(`Row ${index + 2} has a missing or invalid concentration or rate.`);
    }
    if (substrate < 0 || rate < 0) throw new Error(`Row ${index + 2} has a negative value; both measurements must be non-negative.`);
    return {
      substrate,
      rate,
      substrateText: cells[substrateIndex],
      rateText: cells[rateIndex],
    };
  });

  if (measurements.length < 3) throw new Error("At least three measurements are required for nonlinear fitting.");
  if (new Set(measurements.map(({ substrate }) => substrate)).size < 3) {
    throw new Error("At least three distinct substrate concentrations are required.");
  }
  if (!measurements.some(({ substrate }) => substrate > 0) || !measurements.some(({ rate }) => rate > 0)) {
    throw new Error("The data must include positive substrate concentrations and at least one positive rate.");
  }
  return measurements;
}

function setData(measurements, sourceName) {
  data = measurements;
  uploadTitle.textContent = sourceName;
  uploadHint.textContent = `${data.length} rows · choose another CSV to replace`;
  const body = document.querySelector("#data-rows");
  body.replaceChildren(...data.slice(0, 6).map(({ substrate, rate, substrateText, rateText }) => {
    const row = document.createElement("tr");
    const substrateCell = document.createElement("td");
    const rateCell = document.createElement("td");
    substrateCell.textContent = substrateText ?? formatNumber(substrate);
    rateCell.textContent = rateText ?? formatNumber(rate);
    row.append(substrateCell, rateCell);
    return row;
  }));
  document.querySelector("#row-count").textContent = `${data.length} ${data.length === 1 ? "row" : "rows"}`;
  if (data.length > 6) {
    const moreRow = document.createElement("tr");
    const moreCell = document.createElement("td");
    moreCell.className = "more-cell";
    moreCell.colSpan = 2;
    moreCell.textContent = `+ ${data.length - 6} more measurements`;
    moreRow.append(moreCell);
    body.append(moreRow);
  }
  fitButton.disabled = false;
  resetResults();
}

function clearData() {
  data = [];
  uploadTitle.textContent = "Choose a CSV file";
  uploadHint.textContent = "or drag it here · .csv";
  document.querySelector("#data-rows").innerHTML = '<tr><td class="empty-cell" colspan="2">Load data to see a preview</td></tr>';
  document.querySelector("#row-count").textContent = "No data loaded";
  fitButton.disabled = true;
  resetResults();
}

async function fitMichaelisMenten(measurements) {
  const substrates = measurements.map(({ substrate }) => substrate).join(",");
  const rates = measurements.map(({ rate }) => rate).join(",");
  const code = `
    observations <- data.frame(substrate=c(${substrates}), rate=c(${rates}))
    fit <- nls(
      rate ~ exp(log_vmax) * substrate / (exp(log_km) + substrate),
      data=observations,
      start=list(
        log_vmax=log(max(observations$rate) * 1.5),
        log_km=log(median(observations$substrate[observations$substrate > 0]))
      ),
      control=nls.control(maxiter=500, warnOnly=FALSE)
    )
    coefficients <- coef(fit)
    vmax <- exp(coefficients[["log_vmax"]])
    km <- exp(coefficients[["log_km"]])
    curve_x <- seq(0, max(observations$substrate) * 1.08, length.out=121)
    curve_y <- predict(fit, newdata=data.frame(substrate=curve_x))
    paste(sprintf("%.17g", c(vmax, km, curve_x, curve_y)), collapse=",")
  `;
  const encoded = String(await webR.evalRString(code));
  const values = encoded.split(",").map(Number);
  if (values.length !== 244 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("R returned an incomplete or invalid result.");
  }
  const [vmax, km] = values;
  const curve = Array.from({ length: 121 }, (_, index) => ({
    substrate: values[2 + index],
    rate: values[123 + index],
  }));
  const meanRate = measurements.reduce((total, point) => total + point.rate, 0) / measurements.length;
  const totalSquares = measurements.reduce((total, point) => total + (point.rate - meanRate) ** 2, 0);
  const residualSquares = measurements.reduce((total, point) => {
    const predicted = vmax * point.substrate / (km + point.substrate);
    return total + (point.rate - predicted) ** 2;
  }, 0);
  const rSquared = totalSquares === 0 ? NaN : 1 - residualSquares / totalSquares;
  if (!Number.isFinite(vmax) || !Number.isFinite(km) || vmax <= 0 || km <= 0 || !Number.isFinite(rSquared)) {
    throw new Error("The fit did not produce finite, positive parameters. Check that the data spans the curve.");
  }
  return { vmax, km, rSquared, curve };
}

function renderResults(result) {
  const rateUnit = document.querySelector("#rate-unit").value.trim();
  const substrateUnit = document.querySelector("#substrate-unit").value.trim();
  document.querySelector("#vmax-value").textContent = formatNumber(result.vmax);
  document.querySelector("#vmax-unit").textContent = rateUnit || "Rate units";
  document.querySelector("#km-value").textContent = formatNumber(result.km);
  document.querySelector("#km-unit").textContent = substrateUnit || "Concentration units";
  document.querySelector("#r2-value").textContent = result.rSquared.toFixed(4);
  document.querySelector("#chart-placeholder").classList.add("hidden");
  document.querySelector("#chart-content").classList.remove("hidden");
  document.querySelector("#chart-container").replaceChildren(createChart(result.curve));
}

function createChart(curve) {
  const width = 660;
  const height = 330;
  const margin = { top: 16, right: 20, bottom: 56, left: 68 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxX = Math.max(...data.map(({ substrate }) => substrate), 0.1) * 1.08;
  const maxY = Math.max(...data.map(({ rate }) => rate), ...curve.map(({ rate }) => rate), 0.1) * 1.12;
  const x = (value) => margin.left + value / maxX * plotWidth;
  const y = (value) => margin.top + plotHeight - value / maxY * plotHeight;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Scatter plot of observed rates with the fitted Michaelis–Menten curve");

  for (let tick = 0; tick <= 4; tick += 1) {
    const valueY = maxY * tick / 4;
    const line = svgElement("line", { x1: margin.left, y1: y(valueY), x2: width - margin.right, y2: y(valueY), class: "grid-line" });
    const label = svgElement("text", { x: margin.left - 10, y: y(valueY) + 4, "text-anchor": "end", class: "tick-label" });
    label.textContent = formatNumber(valueY);
    svg.append(line, label);

    const valueX = maxX * tick / 4;
    const xLabel = svgElement("text", { x: x(valueX), y: height - margin.bottom + 22, "text-anchor": "middle", class: "tick-label" });
    xLabel.textContent = formatNumber(valueX);
    svg.append(xLabel);
  }

  svg.append(svgElement("line", { x1: margin.left, y1: margin.top, x2: margin.left, y2: height - margin.bottom, class: "axis-line" }));
  svg.append(svgElement("line", { x1: margin.left, y1: height - margin.bottom, x2: width - margin.right, y2: height - margin.bottom, class: "axis-line" }));
  const curvePath = curve.map((point, index) => `${index === 0 ? "M" : "L"}${x(point.substrate).toFixed(2)},${y(point.rate).toFixed(2)}`).join(" ");
  svg.append(svgElement("path", { d: curvePath, class: "fit-curve" }));

  for (const point of data) {
    svg.append(svgElement("circle", { cx: x(point.substrate), cy: y(point.rate), r: 5, class: "observation-point" }));
  }

  const substrateLabel = svgElement("text", { x: margin.left + plotWidth / 2, y: height - 8, "text-anchor": "middle", class: "axis-label" });
  substrateLabel.textContent = `Substrate (${document.querySelector("#substrate-unit").value.trim() || "units"})`;
  const rateLabel = svgElement("text", { x: 17, y: margin.top + plotHeight / 2, transform: `rotate(-90 17 ${margin.top + plotHeight / 2})`, "text-anchor": "middle", class: "axis-label" });
  rateLabel.textContent = `Initial rate (${document.querySelector("#rate-unit").value.trim() || "units"})`;
  svg.append(substrateLabel, rateLabel);
  return svg;
}

function svgElement(name, attributes) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

function resetResults() {
  for (const id of ["vmax-value", "km-value", "r2-value"]) document.querySelector(`#${id}`).textContent = "—";
  document.querySelector("#vmax-unit").textContent = "Maximum rate";
  document.querySelector("#km-unit").textContent = "Half-max concentration";
  document.querySelector("#chart-placeholder").classList.remove("hidden");
  document.querySelector("#chart-content").classList.add("hidden");
  document.querySelector("#chart-container").replaceChildren();
}

function setBusy(busy) {
  fitButton.disabled = busy || data.length === 0;
  fitButton.classList.toggle("busy", busy);
  fitLabel.textContent = busy ? "Running model…" : "Fit Michaelis–Menten model";
}

function setStatus(message, kind = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${kind}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat(undefined, { maximumSignificantDigits: 4 }).format(value);
}
