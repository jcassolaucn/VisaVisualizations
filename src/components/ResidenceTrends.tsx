import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';

const ResidenceTrends = () => {
  const [residenceTrends, setResidenceTrends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch temporary residences CSV
        const temporalResponse = await fetch('./data/temporales_20_por_ciento.csv');
        const temporalText = await temporalResponse.text();
        
        // Fetch permanent residences CSV
        const permanentResponse = await fetch('./data/definitivas_20_por_ciento.csv');
        const permanentText = await permanentResponse.text();

        // Parse CSVs
        const temporalData = Papa.parse(temporalText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        }).data;

        const permanentData = Papa.parse(permanentText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        }).data;

        // Filter rows where TIPO_RESUELTO is "Otorga"
        const filteredTemporalData = temporalData.filter(row => row.TIPO_RESUELTO === "Otorga");
        const filteredPermanentData = permanentData.filter(row => row.TIPO_RESUELTO === "Otorga");

        // Group and count by year for temporary residences
        const temporalGrouped = _.groupBy(filteredTemporalData, 'AÑO');
        const temporalCounts = _.mapValues(temporalGrouped, 'length');

        // Group and count by year for permanent residences
        const permanentGrouped = _.groupBy(filteredPermanentData, 'AÑO');
        const permanentCounts = _.mapValues(permanentGrouped, 'length');

        // Get all unique years
        const allYears = _.uniq([
          ...Object.keys(temporalCounts).map(Number),
          ...Object.keys(permanentCounts).map(Number)
        ]).sort();

        // Combine data
        const combinedData = allYears.map(year => ({
          year,
          temporal: temporalCounts[year] || 0,
          permanent: permanentCounts[year] || 0
        }));

        setResidenceTrends(combinedData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading residence data:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin w-12 h-12 text-blue-500" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="flex justify-center items-center h-64 text-red-500">
            Error al cargar los datos: {error.message}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Tendencias de Residencias Otorgadas (Temporales y Definitivas - 20%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={residenceTrends}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                
                <XAxis 
                  dataKey="year" 
                  label={{ 
                    value: 'Año', 
                    position: 'insideBottomRight', 
                    offset: -10 
                  }}
                />
                
                <YAxis 
                  label={{ 
                    value: 'Número de Residencias Otorgadas', 
                    angle: -90, 
                    position: 'insideLeft' 
                  }}
                />
                
                <Tooltip 
                  contentStyle={{ backgroundColor: '#f9f9f9' }}
                  labelStyle={{ fontWeight: 'bold' }}
                  formatter={(value, name) => {
                    const formattedValue = new Intl.NumberFormat('es-CL').format(Number(value));
                    return [formattedValue, name === 'temporal' ? 'Residencias Temporales' : 'Residencias Definitivas'];
                  }}
                />
                
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value) => 
                    value === 'temporal' ? 'Residencias Temporales' : 'Residencias Definitivas'
                  }
                />
                
                <Line 
                  type="monotone" 
                  dataKey="temporal" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                />
                
                <Line 
                  type="monotone" 
                  dataKey="permanent" 
                  stroke="#16a34a" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidenceTrends;