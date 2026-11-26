import { byId, cur, money, roomNames, stayConflicts } from "../state/selectors.js";
import { form } from "../components/form.js";
import { S, ui } from "../state/store.js";
import { addDays, fmtDay, today } from "../domain/dates.js";
import { $, esc } from "../utils/dom.js";
import { num } from "../domain/money.js";
import { audit } from "../firebase/audit.js";
import { del, save } from "../firebase/writes.js";
import { render } from "../app/render.js";

export function editStay(id, preset = {}) {
  const s = id ? byId("stays", id) : null;
  form(
    s ? "Edit stay" : "New stay",
    [
      { k: "guestName", label: "Guest name", req: true },
      { k: "phone", label: "Phone", type: "tel" },
      { k: "idNo", label: "ID / passport number (optional)" },
      {
        k: "roomIds",
        label: "Room(s)",
        type: "checks",
        req: true,
        opts: S.rooms.map((r) => [r.id, r.name + (r.type ? " (" + r.type + ")" : "")]),
      },
      { k: "checkIn", label: "Check-in date", type: "date", req: true },
      { k: "checkOut", label: "Check-out date", type: "date", req: true },
      {
        k: "rateOverride",
        ownerOnly: true,
        label: `Price per night override for all rooms (${cur()}). Leave 0 to use the room rates`,
        type: "number",
        step: "0.01",
      },
      { k: "adults", label: "Number of guests", type: "number" },
      {
        k: "source",
        label: "Booked via",
        type: "select",
        opts: ["Walk-in", "Phone call", "WhatsApp", "Online platform", "Referral", "Event guest"].map((x) => [
          x,
          x,
        ]),
      },
      {
        k: "status",
        label: "Status",
        type: "select",
        opts: [
          ["reserved", "Reserved"],
          ["checkedin", "Checked in"],
          ["checkedout", "Checked out"],
          ["cancelled", "Cancelled"],
          ["noshow", "No-show"],
        ],
      },
      { k: "discount", ownerOnly: true, label: `Discount (${cur()})`, type: "number", step: "0.01" },
      { k: "notes", label: "Notes", type: "textarea" },
    ],
    s || {
      status: "reserved",
      checkIn: today(),
      checkOut: addDays(today(), 1),
      adults: 1,
      source: "Walk-in",
      ...preset,
    },
    {
      validate(o) {
        if (o.checkOut <= o.checkIn) return "Check-out must be after check-in.";
        if (o.status === "cancelled" || o.status === "noshow") return "";
        const c = stayConflicts({ id, roomIds: o.roomIds, checkIn: o.checkIn, checkOut: o.checkOut });
        if (c.length && !$("#mf").dataset.force) {
          $("#mf").dataset.force = "1";
          return (
            "<b>Room already taken:</b> " +
            c
              .map(
                (x) =>
                  `${esc(x.guestName)} (Room ${esc(roomNames(x))}, ${esc(fmtDay(x.checkIn))} → ${esc(fmtDay(x.checkOut))})`,
              )
              .join("; ") +
            ".<br>Change the dates or room, or press Save again to book anyway."
          );
        }
        return "";
      },
      onSave(o) {
        if (num(o.discount) > 0) audit("discount", "Stay " + o.guestName + ": " + money(o.discount));
        const nid = save("stays", id, { ...o, ...(id ? {} : { extras: [], createdAt: Date.now() }) });
        if (!id) {
          ui.stayDetail = nid;
          ui.detail = null;
          render();
        }
      },
      onDelete: s
        ? () => {
            del("stays", id);
            ui.stayDetail = null;
            render();
          }
        : null,
    },
  );
}

export function editExtra(sid, i) {
  const s = byId("stays", sid),
    list = (s.extras || []).slice(),
    e = i === null ? null : list[i];
  form(
    e ? "Edit charge" : "Extra charge",
    [
      { k: "t", label: "Description", req: true, ph: "Laundry, extra bed, late checkout…" },
      { k: "amount", label: `Amount (${cur()})`, type: "number", step: "0.01", req: true },
    ],
    e || {},
    {
      onSave(o) {
        if (e) list[i] = o;
        else list.push(o);
        save("stays", sid, { extras: list });
      },
      onDelete: e
        ? () => {
            list.splice(i, 1);
            save("stays", sid, { extras: list });
          }
        : null,
    },
  );
}
