import { test } from "node:test";
import assert from "node:assert/strict";
import { createCollectingSink, noopSink } from "./telemetry";

test("collecting sink records emitted events in order", () => {
  const { sink, events } = createCollectingSink();
  sink.emit({ name: "cta_clicked", props: { cta_id: "book", surface_id: "care" } });
  sink.emit({
    name: "joy_state_seen",
    props: { cta_id: "book", surface_id: "care", variant: "care" },
  });

  assert.equal(events.length, 2);

  const first = events[0];
  assert.equal(first.name, "cta_clicked");
  if (first.name === "cta_clicked") {
    assert.equal(first.props.surface_id, "care");
  }

  const second = events[1];
  assert.equal(second.name, "joy_state_seen");
  if (second.name === "joy_state_seen") {
    assert.equal(second.props.variant, "care");
  }
});

test("noop sink accepts events without throwing", () => {
  assert.doesNotThrow(() =>
    noopSink.emit({
      name: "pricing_revealed",
      props: { surface_id: "checkout", currency: "NGN" },
    }),
  );
});
