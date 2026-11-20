import Link from "next/link";
import { formatGameStamp, formatPoints, formatRating, formatSigned, pointsClass } from "@/lib/mleague/format";
import { tableAverageRating } from "@/lib/mleague/matchDay";
import type { RatingEvent } from "@/lib/mleague/types";
import { Avatar } from "./Avatar";

export type GameHistoryRow = {
  event: RatingEvent;
  player?: { name: string; slug: string; photo?: string };
};

export function GameHistoryTable({
  rows,
  playerHref,
  ratingBeforeByGame,
  showPlayer = false,
}: {
  rows: GameHistoryRow[];
  playerHref: Map<string, string>;
  ratingBeforeByGame: Map<string, number>;
  showPlayer?: boolean;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--muted)]">対局結果はまだありません。</p>;
  }

  return (
    <div className="table-wrap">
      <table className={`data${showPlayer ? " has-entrant" : ""}`}>
        <thead>
          <tr>
            {showPlayer ? <th className="col-entrant">出場</th> : null}
            <th>日付</th>
            <th>着順</th>
            <th>収支</th>
            <th>R変動</th>
            <th>対戦</th>
            <th title="試合前の通算卓平均R">卓平均</th>
            <th>R</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const event = row.event;
            const tableAverage = tableAverageRating([
              event.ratingBefore,
              ...event.opponents.map((name) => ratingBeforeByGame.get(`${event.gameId}\0${name}`)),
            ]);
            return (
              <tr key={`${event.gameId}-${event.date}-${event.rank}`}>
                {showPlayer ? (
                  <td className="col-entrant">
                    {row.player ? (
                      <Link
                        href={`/players/${row.player.slug}`}
                        className="person hover:text-[var(--gold)]"
                      >
                        <Avatar src={row.player.photo} name={row.player.name} size={36} />
                        <span className="font-medium">{row.player.name}</span>
                      </Link>
                    ) : (
                      <span className="text-[var(--muted)]">-</span>
                    )}
                  </td>
                ) : null}
                <td>{formatGameStamp(event.date, event.round > 0 ? event.round : 1)}</td>
                <td>{event.rank}着</td>
                <td className={pointsClass(event.points)}>{formatPoints(event.points)}</td>
                <td className={pointsClass(event.delta)}>{formatSigned(event.delta)}</td>
                <td>
                  {event.opponents.map((name, index) => {
                    const slug = playerHref.get(name);
                    return (
                      <span key={`${event.gameId}-${name}`}>
                        {index > 0 ? " / " : null}
                        {slug ? (
                          <Link
                            href={`/players/${slug}`}
                            className="underline decoration-[var(--line)] underline-offset-2 hover:text-[var(--gold)] hover:decoration-[var(--gold)]"
                          >
                            {name}
                          </Link>
                        ) : (
                          name
                        )}
                      </span>
                    );
                  })}
                </td>
                <td className="font-mono text-[var(--gold-2)]">
                  {tableAverage == null ? "-" : formatRating(tableAverage)}
                </td>
                <td className="font-mono text-[var(--gold-2)]">{formatRating(event.ratingAfter)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
