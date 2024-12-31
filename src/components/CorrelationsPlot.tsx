import { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';
import '../styles/visualizations.css';

const CorrelationPlot = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

    // Definir las regiones por zona
    const regionesPorZona = {
      "Norte": ['Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo'],
      "Metropolitana": ['Metropolitana de Santiago'],
      "Sur": ['Valparaíso', "O'Higgins", 'Maule', 'Ñuble', 'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes']
    };
    
  
  useEffect(() => {
    const processData = async () => {
      debugger
      try {
        // Función para clasificar regiones
        const getZona = (region) => {
          const norte = ['Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo'];
          const metropolitana = ['Metropolitana de Santiago'];
          return norte.some(r => region.includes(r)) ? 'Norte' : 
                 metropolitana.some(r => region.includes(r)) ? 'Metropolitana' : 
                 'Sur';
        };

        // Leer archivos desde public
        const [tempRes, defRes, pib] = await Promise.all([
          fetch('./data/temporales_20_por_ciento.csv').then(res => res.text()),
          fetch('./data/definitivas_20_por_ciento.csv').then(res => res.text()),
          fetch('./data/PIB.csv').then(res => res.text())
        ]);

        // Opciones de parsing
        const parseOptions = {
          delimiter: ";",
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true
        };

        // Parsear CSVs
        const tempData = Papa.parse(tempRes, parseOptions).data;
        const defData = Papa.parse(defRes, parseOptions).data;
        const pibData = Papa.parse(pib, parseOptions).data;

        // Procesar residencias (temporales + definitivas)
        const processResidencias = (data) => {
          return _(data)
            .filter(d => d.AÑO >= 2013 && d.AÑO <= 2020 && d.TIPO_RESUELTO === 'Otorga')
            .groupBy(d => `${d.REGIÓN}_${d.AÑO}`)
            .mapValues(group => group.length)
            .value();
        };

        const tempCounts = processResidencias(tempData);
        const defCounts = processResidencias(defData);

        // Combinar conteos de residencias
        const totalResidencias = {};
        Object.keys({...tempCounts, ...defCounts}).forEach(key => {
          const [region, year] = key.split('_');
          const tempCount = tempCounts[key] || 0;
          const defCount = defCounts[key] || 0;
          if (!totalResidencias[region]) totalResidencias[region] = {};
          totalResidencias[region][year] = tempCount + defCount;
        });

        // Procesar PIB y combinar datos
        const combinedData = [];
        pibData.forEach(row => {
          const region = row.REGIÓN;
          const zona = getZona(region);
          
          Object.entries(row).forEach(([year, value]) => {
            if (!isNaN(year) && year >= 2013 && year <= 2020) {
              const residencias = totalResidencias[region]?.[year] || 0;
              const pibValue = parseFloat(String(value).replace(',', '.'));
              
              if (pibValue && residencias) {  // Solo agregar si tenemos ambos valores
                combinedData.push({
                  region: zona,
                  pib: pibValue,
                  residencias: residencias,
                  year: parseInt(year),
                  logPib: Math.log10(pibValue),
                  logResidencias: Math.log10(residencias),
                  size: (parseInt(year) - 2012) * 100
                });
              }
            }
          });
        });

        setData(combinedData);
      } catch (error) {
        console.error('Error processing data:', error);
      } finally {
        setLoading(false);
      }
    };

    processData();
  }, []);

  // Colores por región
  const regionColors = {
    "Norte": "#8884d8",
    "Sur": "#82ca9d",
    "Metropolitana": "#ffc658"
  };

  // Crear series de datos por región
  const dataSeries = Object.keys(regionColors).map(region => ({
    name: region,
    data: data.filter(item => item.region === region),
    fill: regionColors[region]
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border rounded shadow-lg">
          <p className="font-bold">{data.region}</p>
          <p>Año: {data.year}</p>
          <p>PIB: {data.pib.toLocaleString()}</p>
          <p>Residencias: {data.residencias.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="w-full correlation-plot">
        <CardHeader>
          <CardTitle>Correlación PIB Regional vs Residencias</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full hd-width">
      <CardHeader>
        <CardTitle>Correlación PIB Regional vs Residencias</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis 
                type="number" 
                dataKey="logPib" 
                name="PIB" 
                label={{ value: 'Log PIB', position: 'bottom' }}
              />
              <YAxis 
                type="number" 
                dataKey="logResidencias" 
                name="Residencias" 
                label={{ value: 'Log Residencias', angle: -90, position: 'left' }}
              />
              <ZAxis type="number" dataKey="size" range={[100, 600]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {dataSeries.map((series, index) => (
                <Scatter
                  key={series.name}
                  // name={series.name}
                  data={series.data}
                  fill={series.fill}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="w-64 text-sm">
            <h3 className="font-bold mb-2">Regiones por zona:</h3>
            {Object.entries(regionesPorZona).map(([zona, regiones]) => (
              <div key={zona} className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: regionColors[zona] }}
                  />
                  <span className="font-medium">{zona}</span>
                </div>
                <ul className="list-disc list-inside pl-5 text-gray-600">
                  {regiones.map(region => (
                    <li key={region}>{region}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
      </CardContent>
    </Card>
  );
};

export default CorrelationPlot;