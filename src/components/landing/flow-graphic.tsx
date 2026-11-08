/** Malla decorativa de flujo: líneas que viajan entre nodos (concepto «Kinesis»). */
export function FlowGraphic() {
  const paths = [
    "M0  80 C180 40 300 220 520 130 S800 40 1000 110",
    "M0 200 C160 260 340 120 540 210 S820 280 1000 190",
    "M0 290 C200 230 320 340 560 280 S840 200 1000 280",
    "M0 250 C250 360 380 400 600 203 S840 85 1000 100",
  ];
  const nodes: [number, number][] = [
    [180, 100],
    [180, 320],
    [520, 130],
    [780, 80],
    [540, 210],
    [560, 280],
  ];

  return (
    <svg
      className="landing-flow"
      viewBox="0 0 1000 360"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="flow-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#367ef6" stopOpacity="0" />
          <stop offset="0.5" stopColor="#22c0f8" />
          <stop offset="1" stopColor="#367ef6" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {paths.map((d, i) => (
        <g key={d}>
          <path d={d} className="landing-flow-base" />
          <path
            d={d}
            className="landing-flow-signal"
            style={{ animationDelay: `${i * 1.4}s` }}
          />
        </g>
      ))}
      {nodes.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" className="landing-flow-node" />
      ))}
    </svg>
  );
}

