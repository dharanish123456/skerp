import './ShinyText.css';

const ShinyText = ({
  text,
  disabled = false,
  speed = 2,
  className = '',
  color = '#b5b5b5',
  shineColor = '#ffffff',
  spread = 120,
}) => {
  const gradientStyle = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animationDuration: `${speed}s`,
    animationPlayState: disabled ? 'paused' : 'running',
  };

  return (
    <span
      className={`shiny-text ${className}`}
      style={gradientStyle}
    >
      {text}
    </span>
  );
};

export default ShinyText;
