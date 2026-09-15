/* Two lines, always - so every row in the table is the same height.

   This used to offer "Show more", which expanded the cell in place and pushed
   that one row to four or five lines while its neighbours stayed at two. That
   is the thing that made the table look ragged, so the expander is gone: the
   clamp is now the rule rather than a first impression of one.

   Nothing is lost with it. The full summary is a native tooltip away, and the
   feature page - one click from the name in the next column - carries the
   whole thing as body copy.

   The clamp is line-clamp-2 rather than the hand-rolled -webkit-box stack the
   stylesheet used; Tailwind's utility emits the same three properties. */
const SummaryCell = ({ text }: { text: string }) => (
  <div className="line-clamp-2 max-w-cell text-ink-700" title={text}>
    {text}
  </div>
);

export default SummaryCell;
