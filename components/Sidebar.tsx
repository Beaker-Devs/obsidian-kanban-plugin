import * as React from 'react';

const NAV_ITEMS = [
  'People', 'Companies', 'Opportunities', 'Tasks', 'Notes', 'Invoices', 'Bill Payments', 'Expenses', 'Workflows'
];

export const Sidebar: React.FC<{ selected?: string, onSelect?: (item: string) => void }> = ({ selected = 'Expenses', onSelect }) => (
  <div className="sidebar">
    <div className="sidebar-header">Beaker</div>
    <ul className="sidebar-list">
      {NAV_ITEMS.map(item => (
        <li
          key={item}
          className={`sidebar-item${item === selected ? ' selected' : ''}`}
          onClick={() => onSelect?.(item)}
        >
          {item}
        </li>
      ))}
    </ul>
  </div>
);
