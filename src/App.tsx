import React, { useState } from 'react';
import Nav from './components/Nav';
import ResidenceTrends from './components/ResidenceTrends';
import CorrelationPlot from './components/CorrelationsPlot';
import DemographicAnalysis from './components/DemographicAnalysis';
import './App.css';


const App: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState('ResidenceTrends');

  const renderComponent = () => {
    switch (activeComponent) {
      case 'ResidenceTrends':
        return <ResidenceTrends />;
      case 'CorrelationPlot':
        return <CorrelationPlot />;
      case 'DemographicAnalysis':
        return <DemographicAnalysis />;
      default:
        return <ResidenceTrends />;
    }
  };

  return (
    <>
      <Nav setActiveComponent={setActiveComponent} />
    <div className='center-viz'>
      {renderComponent()}
    </div>
    </>
  );
};

export default App;