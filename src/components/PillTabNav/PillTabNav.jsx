import './PillTabNav.css';

const PillTabNav = ({ items, value, onChange, ariaLabel = 'Sections', className = '' }) => (
  <div className={`pill-tab-nav${className ? ` ${className}` : ''}`}>
    <div className="pill-tab-nav__track" role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`pill-tab${isActive ? ' is-active' : ''}`}
            onClick={() => onChange(item.value)}
          >
            <span className="pill-tab__circle" aria-hidden="true" />
            <span className="pill-tab__labels">
              <span className="pill-tab__label">{item.label}</span>
              <span className="pill-tab__label-hover" aria-hidden="true">{item.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

export default PillTabNav;
