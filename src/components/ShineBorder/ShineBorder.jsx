import './ShineBorder.css';

const ShineBorder = ({
  shineColor = ['#A07CFE', '#FE8FB5', '#FFBE7B'],
  duration = 8,
  borderWidth = 2,
  className = '',
}) => {
  const colors = Array.isArray(shineColor) ? shineColor : [shineColor];
  const colorStops = colors
    .map((color, index) => `${color} ${35 + (index * 30) / Math.max(colors.length - 1, 1)}%`)
    .join(', ');

  return (
    <span
      aria-hidden="true"
      className={`shine-border${className ? ` ${className}` : ''}`}
      style={{
        '--shine-border-width': `${borderWidth}px`,
        '--shine-duration': `${duration}s`,
        '--shine-gradient': `linear-gradient(115deg, transparent 15%, ${colorStops}, transparent 85%)`,
      }}
    />
  );
};

export default ShineBorder;
