import * as React from 'react';
import { GenericTableDemo } from './GenericTable';

const NAV_ITEMS = [
  'People', 'Companies', 'Opportunities', 'Tasks', 'Notes', 'Invoices', 'Bill Payments', 'Expenses', 'Workflows'
];

export const App: React.FC = () => {
  const [selected, setSelected] = React.useState('Expenses');
  return (
    <div className="kanban-layout">
      <div className="kanban-sidebar">
        <div className="sidebar-header-app">Beaker</div>
        <ul className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <li
              key={item}
              className={`sidebar-nav-item${item === selected ? ' active' : ''}`}
              onClick={() => setSelected(item)}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="kanban-main-content">
        <GenericTableDemo />
      </div>
    </div>
  );
}; 