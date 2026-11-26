import { csv, readMenu } from "./files.js";
import { ui } from "../state/store.js";
import { render } from "../app/render.js";
import { runDiagnostics } from "../firebase/diagnostics.js";
import { editVenue } from "../editors/venue.js";
import { loadAudit } from "../firebase/audit.js";
import { auditFiltered } from "../state/selectors.js";
import { csvText } from "../domain/csv.js";
import { today } from "../domain/dates.js";
import { doBackup } from "../firebase/backup.js";
import { $ } from "../utils/dom.js";

export const adminActions = {
  importMenu: () => {
    const i = document.createElement("input");
    i.type = "file";
    i.accept = ".json,application/json";
    i.onchange = () => readMenu(i.files[0]);
    i.click();
  },
  diagRun: () => {
    ui.sub = "diag";
    ui.diag = [];
    render();
    runDiagnostics();
  },
  venue: () => editVenue(),
  alRefresh: () => loadAudit(),
  alCsv: () => {
    const rows = [
      ["Date", "Time", "Staff", "Action", "Detail"],
      ...auditFiltered().map((a) => [
        new Date(a.ts).toLocaleDateString(),
        new Date(a.ts).toLocaleTimeString(),
        a.by,
        a.action,
        a.detail,
      ]),
    ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csvText(rows)], { type: "text/csv" }));
    a.download = "activity-log-" + today() + ".csv";
    a.click();
  },
  backup: () => doBackup(),
  restore: () => {
    const f = $("#restoreFile");
    if (f) f.click();
  },
  csv: (d) => csv(d.k),
};
