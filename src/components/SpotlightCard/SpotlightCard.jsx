import { useRef } from 'react';
import './SpotlightCard.css';

const SpotlightCard = ({
  children,
  className = '',
  spotlightColor = 'rgba(0, 0, 0, 0.06)',
}) => {
  const cardRef = useRef(null);

  const handlePointerMove = (event) => {
    const card = cardRef.current;
    if (!card || event.pointerType === 'touch') return;

    const rect = card.getBoundingClientRect();
    card.style.setProperty('--spotlight-x', `${event.clientX - rect.left}px`);
    card.style.setProperty('--spotlight-y', `${event.clientY - rect.top}px`);
  };

  return (
    <div
      ref={cardRef}
      className={`spotlight-card${className ? ` ${className}` : ''}`}
      style={{ '--spotlight-color': spotlightColor }}
      onPointerMove={handlePointerMove}
    >
      <div className="spotlight-card__content">{children}</div>
    </div>
  );
};

export default SpotlightCard;
