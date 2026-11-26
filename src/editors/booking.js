import { byId, conflicts, crewText, cur, money, spaceName } from "../state/selectors.js";
import { S, ui } from "../state/store.js";
import { fmtRange, today } from "../domain/dates.js";
import { form } from "../components/form.js";
import { isOwner } from "../state/session.js";
import { $, esc } from "../utils/dom.js";
import { parseCrew } from "../domain/parse.js";
import { num } from "../domain/money.js";
import { DEFAULT_CHECKLIST } from "../config/constants.js";
import { del, save, saveCrewPay } from "../firebase/writes.js";
import { crewKey } from "../domain/crew.js";
import { toast } from "../components/toast.js";
import { render } from "../app/render.js";

/* ---------- editors ---------- */
export function editBooking(id, preset = {}) {
  const b = id ? byId("bookings", id) : null;
  const d = ui.day || today();
  const vals = b
    ? { ...b, crew: crewText(b), priceOverride: b.priceOverride || "" }
    : { status: "confirmed", start: d + "T10:00", end: d + "T18:00", ...preset };
  form(
    b ? "Edit booking" : "New booking",
    [
      { k: "title", label: "Event name", req: true, ph: "e.g. Mensah wedding reception" },
      {
        k: "clientId",
        label: "Client",
        type: "select",
        opts: [["", "— none / walk-in —"], ...S.clients.map((c) => [c.id, c.name])],
      },
      {
        k: "spaceIds",
        label: "Hall(s) / space(s)",
        type: "checks",
        req: true,
        opts: S.spaces.map((s) => [
          s.id,
          s.name +
            (s.rateWeekday || s.rate
              ? " (" +
                money(s.rateWeekday || s.rate) +
                " weekday / " +
                money(s.rateWeekend || s.rateWeekday || s.rate) +
                " weekend)"
              : ""),
        ]),
      },
      { k: "start", label: "Starts", type: "datetime-local", req: true },
      { k: "end", label: "Ends", type: "datetime-local", req: true },
      { k: "guests", label: "Expected guests", type: "number" },
      isOwner()
        ? {
            k: "priceOverride",
            label: `Price override (${cur()}). Leave empty to use the weekday / weekend rates`,
            type: "number",
            step: "0.01",
          }
        : {
            k: "autoPrice",
            type: "info",
            label: "Price",
            text: "Worked out automatically from the owner's weekday and weekend rates when you save.",
          },
      {
        k: "status",
        label: "Status",
        type: "select",
        opts: [
          ["hold", "Hold (not confirmed)"],
          ["confirmed", "Confirmed"],
          ["completed", "Completed"],
          ["cancelled", "Cancelled"],
        ],
      },
      {
        k: "crew",
        label: isOwner()
          ? "Crew for this event (one per line: Name, Role, Pay)"
          : "Crew for this event (one per line: Name, Role)",
        type: "textarea",
        ph: isOwner() ? "Kofi, Security, 150\nAma, Usher, 100" : "Kofi, Security\nAma, Usher",
      },
      { k: "notes", label: "Notes", type: "textarea" },
    ],
    vals,
    {
      validate(o, force) {
        if (o.end <= o.start) return "End time must be after the start time.";
        if (o.status === "cancelled") return "";
        const c = conflicts({ id, spaceIds: o.spaceIds, start: o.start, end: o.end });
        if (c.length && !$("#mf").dataset.force) {
          $("#mf").dataset.force = "1";
          return (
            "<b>Double-booking:</b> " +
            c
              .map(
                (x) =>
                  `${esc(x.title)} (${x.spaceIds
                    .filter((s) => o.spaceIds.includes(s))
                    .map(spaceName)
                    .map(esc)
                    .join(", ")}, ${esc(fmtRange(x))})`,
              )
              .join("; ") +
            ".<br>Change the time or hall, or press Save again to book it anyway."
          );
        }
        return "";
      },
      onSave(o) {
        const client = byId("clients", o.clientId);
        const crewIn = parseCrew(o.crew),
          data = {
            ...o,
            crew: crewIn.map((c) => ({ name: c.name, role: c.role })),
            clientName: client ? client.name : "",
          }; // pay never goes on the booking itself
        if (isOwner()) data.priceOverride = num(o.priceOverride);
        else delete data.priceOverride; // price itself is set by the server
        if (!b)
          ((data.checklist = DEFAULT_CHECKLIST.map((t) => ({ t, done: false }))),
            (data.createdAt = Date.now()));
        const nid = save("bookings", id, data);
        if (isOwner()) {
          const pay = {};
          crewIn.forEach((c) => {
            if (c.pay) pay[crewKey(c)] = c.pay;
          });
          saveCrewPay(nid, pay).catch((e) => toast("Could not save crew pay: " + e.message));
        }
        if (!id) {
          ui.detail = nid;
          render();
        }
      },
      onDelete: b
        ? () => {
            del("bookings", id);
            ui.detail = null;
            render();
          }
        : null,
    },
  );
}
