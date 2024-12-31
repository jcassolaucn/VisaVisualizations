import React from 'react';

interface NavProps {
  setActiveComponent: (component: string) => void;
}

const Nav: React.FC<NavProps> = ({ setActiveComponent }) => {
  return (
    <nav>
      <button className='white-bg' onClick={() => setActiveComponent('ResidenceTrends')}>Residence Trends</button>
      <button className='white-bg' onClick={() => setActiveComponent('CorrelationPlot')}>Correlation Plot</button>
      <button className='white-bg' onClick={() => setActiveComponent('DemographicAnalysis')}>Demographic Analysis</button>
    </nav>
  );
};

export default Nav;