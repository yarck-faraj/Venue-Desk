import { ui } from "../../state/store.js";
import { me, role, staff } from "../../state/session.js";
import { esc } from "../../utils/dom.js";

export function vDiag() {
  const r = ui.diag || [],
    me_ = (me.email || "").toLowerCase(),
    done = r.some((x) => x[0] === "done"),
    bad = r.filter((x) => !x[1]);
  return `<div class="bar"><button class="btn alt sm" data-a="sub" data-k="">‹ Back</button><span class="grow"></span><button class="btn sm" data-a="diagRun">Run again</button></div>
  <div class="card"><h2>Who the app thinks you are</h2><div class="row"><div class="grow s">Signed in as</div><div class="amt">${esc(me_)}</div></div><div class="row"><div class="grow s">Owner on file</div><div class="amt">${esc(staff.ownerEmail || "")}</div></div><div class="row"><div class="grow s">Role seen by the app</div><div class="amt">${esc(role())}</div></div></div>
  <div class="card"><h2>Server checks ${done ? (bad.length ? `<span class="neg">${bad.length} failed</span>` : '<span class="pos">all passed</span>') : "<span>running…</span>"}</h2>
  ${
    r
      .filter((x) => x[0] !== "done")
      .map(
        ([l, ok, m]) =>
          `<div class="row"><div class="grow t">${ok ? "✓" : "✗"} ${esc(l)}</div>${ok ? "" : `<div class="s neg" style="max-width:55%;white-space:normal">${esc(m)}</div>`}</div>`,
      )
      .join("") || '<div class="empty">Starting…</div>'
  }
  ${done && bad.length ? '<p class="s">A "permission-denied" here means the rules published on the server are not the ones in this version. Run <b>firebase deploy --only firestore:rules</b>, then in the Firebase console open Firestore &gt; Rules and check the published date is today. Send this list to the developer.</p>' : ""}
  ${done && !bad.length ? '<p class="s">Sign-in, reading and saving all work for the owner. If something still will not save, note the red message that appears and send it to the developer.</p>' : ""}</div>`;
}
