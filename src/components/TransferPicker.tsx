"use client";
import { useMemo, useState } from "react";
import type { Driver } from "@/lib/data";
import { ContactButtons } from "./ContactButtons";

type Labels = { from: string; to: string; seats: string; years: string; perCar: string; empty: string; som: string; whatsapp: string; telegram: string; showPhone: string };

export function TransferPicker({ drivers, places, labels }: { drivers: Driver[]; places: Record<string, string>; labels: Labels }) {
  const routes = useMemo(() => {
    const seen = new Map<string, { from: string; to: string }>();
    drivers.forEach((d) => d.routes.forEach((r) => seen.set(`${r.from}>${r.to}`, r)));
    return [...seen.values()];
  }, [drivers]);

  const froms = [...new Set(routes.map((r) => r.from))];
  const [from, setFrom] = useState(froms[0]);
  const tos = routes.filter((r) => r.from === from).map((r) => r.to);
  const [toSel, setTo] = useState(tos[0]);
  const to = tos.includes(toSel) ? toSel : tos[0];
  const priceOf = (d: Driver) => d.routes.find((r) => r.from === from && r.to === to)?.price;
  const list = drivers.filter((d) => priceOf(d) !== undefined).sort((a, b) => priceOf(a)! - priceOf(b)!);
  const fmt = (n: number) => n.toLocaleString("ru-RU").replace(/ /g, " ");

  return (
    <>
      <div className="route-pick">
        <label>{labels.from}
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            {froms.map((f) => <option key={f} value={f}>{places[f]}</option>)}
          </select>
        </label>
        <label>{labels.to}
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            {tos.map((f) => <option key={f} value={f}>{places[f]}</option>)}
          </select>
        </label>
      </div>
      <div className="drivers">
        {list.length === 0 && <div className="empty">{labels.empty}</div>}
        {list.map((d) => (
          <div className="driver" key={d.id}>
            <div className="ava">{d.name[0]}</div>
            <div><b>{d.name}</b> <span className="rating">★ {d.rating}</span>
              <div className="car">{d.car} · {labels.seats.replace("{n}", String(d.seats))} · {labels.years.replace("{n}", String(d.years))}</div>
            </div>
            <div className="acts">
              <span className="price">{fmt(priceOf(d)!)} {labels.som} <small>{labels.perCar}</small></span>
              <ContactButtons kind="driver" id={d.id} phone={d.phone} whatsapp={d.whatsapp} small
                labels={{ whatsapp: labels.whatsapp, telegram: labels.telegram, showPhone: labels.showPhone }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
