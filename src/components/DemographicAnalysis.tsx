import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Papa from 'papaparse';
import _ from 'lodash';
import '../styles/visualizations.css';

const DemographicAnalysis = () => {
  const [data, setData] = useState({ byAge: [], byEducation: [], byActivity: [] });
  const [rawData, setRawData] = useState([]);
  const [filtros, setFiltros] = useState({ pais: 'Todos', actividad: 'Todas', estudios: 'Todos' });
  const [loading, setLoading] = useState(true);

  const [paises, setPaises] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [nivelesEducativos, setNivelesEducativos] = useState([]);

  const actualizarFiltro = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const temporalResponse = await fetch('./data/temporales_20_por_ciento.csv');
        const visasTemp = await temporalResponse.text();

        const defResponse = await fetch('./data/definitivas_20_por_ciento.csv');
        const visasDef = await defResponse.text();

        const parseOptions = {
          header: true,
          delimiter: ';',
          dynamicTyping: true,
          skipEmptyLines: true,
        };

        const datosTemp = Papa.parse(visasTemp, parseOptions).data;
        const datosDef = Papa.parse(visasDef, parseOptions).data;
        const allData = [...datosTemp, ...datosDef];

        setRawData(allData);

        const topPaises = agruparTop5(allData, 'PAÍS');
        setPaises(topPaises);

        const topActividades = agruparTop5(allData, 'ACTIVIDAD');
        setActividades(topActividades);

        setNivelesEducativos(_.uniq(allData.map((d) => d.ESTUDIOS)).sort());

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const agruparTop5 = (data, key) => {
    const conteo = _.countBy(data, key);
    const ordenado = _.sortBy(Object.entries(conteo), ([, count]) => -count);
    const top5 = ordenado.slice(0, 5).map(([valor]) => valor);
    return ['Todos', ...top5, 'Otros'];
  };

  const datosFiltrados = useMemo(() => {
    let datos = rawData;

    if (filtros.pais !== 'Todos') {
      datos = filtros.pais === 'Otros'
        ? datos.filter((d) => !paises.includes(d.PAÍS))
        : datos.filter((d) => d.PAÍS === filtros.pais);
    }

    if (filtros.actividad !== 'Todas') {
      datos = filtros.actividad === 'Otros'
        ? datos.filter((d) => !actividades.includes(d.ACTIVIDAD))
        : datos.filter((d) => d.ACTIVIDAD === filtros.actividad);
    }

    if (filtros.estudios !== 'Todos') {
      datos = datos.filter((d) => d.ESTUDIOS === filtros.estudios);
    }

    return datos;
  }, [rawData, filtros, paises, actividades]);

  useEffect(() => {
    if (datosFiltrados.length > 0) {
      setData({
        byAge: processAgeData(datosFiltrados),
        byEducation: processEducationData(datosFiltrados),
        byActivity: processActivityData(datosFiltrados),
      });
    }
  }, [datosFiltrados]);

  const processAgeData = (data) => {
    const rangosEdad = ['0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75+'];
    const edades = data.map(d => {
      const fechaNac = new Date(d.NACIMIENTO);
      const edad = new Date().getFullYear() - fechaNac.getFullYear();
      return { edad, sexo: d.SEXO };
    });

    return rangosEdad.map(rango => {
      const [min, max] = rango.split('-').map(Number);
      const filtered = edades.filter(d => {
        if (rango === '75+') return d.edad >= 75;
        return d.edad >= min && d.edad < (max + 1);
      });

      return {
        rango,
        hombres: -filtered.filter(d => d.sexo === 'Hombre').length,
        mujeres: filtered.filter(d => d.sexo === 'Mujer').length
      };
    });
  };

  const processEducationData = (data) => {
    const byEducation = _.groupBy(data, 'ESTUDIOS');
    return Object.entries(byEducation).map(([nivel, grupo]) => ({
      nivel: nivel || 'No Informa',
      hombres: -grupo.filter(d => d.SEXO === 'Hombre').length,
      mujeres: grupo.filter(d => d.SEXO === 'Mujer').length
    }));
  };

  const processActivityData = (data) => {
    const byActivity = _.groupBy(data, 'ACTIVIDAD');
    return Object.entries(byActivity).map(([actividad, grupo]) => ({
      actividad: actividad || 'No Informa',
      hombres: -grupo.filter(d => d.SEXO === 'Hombre').length,
      mujeres: grupo.filter(d => d.SEXO === 'Mujer').length
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><span>Cargando datos...</span></div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 hd-width">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Análisis de Visas en Chile</CardTitle>
          <div className="flex flex-wrap gap-4 mt-4">
            <select className="p-2 border rounded white-bg" value={filtros.pais} onChange={(e) => actualizarFiltro('pais', e.target.value)}>
              {paises.map((pais) => (
                <option key={pais} value={pais}>{pais}</option>
              ))}
            </select>
            <select className="p-2 border rounded white-bg" value={filtros.actividad} onChange={(e) => actualizarFiltro('actividad', e.target.value)}>
              {actividades.map((actividad) => (
                <option key={actividad} value={actividad}>{actividad}</option>
              ))}
            </select>
            <select className="p-2 border rounded white-bg" value={filtros.estudios} onChange={(e) => actualizarFiltro('estudios', e.target.value)}>
              <option value="Todos">Todos los niveles educativos</option>
              {nivelesEducativos.map((nivel) => (
                <option key={nivel} value={nivel}>{nivel}</option>
              ))}
            </select>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="piramide" className="w-full">
        <TabsList>
          <TabsTrigger value="piramide">Pirámide Poblacional</TabsTrigger>
          <TabsTrigger value="educacion">Distribución Educativa</TabsTrigger>
          <TabsTrigger value="actividad">Actividad Económica</TabsTrigger>
        </TabsList>

        <TabsContent value="piramide">
          <Card>
            <CardContent className="pt-6">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byAge} layout="vertical" margin={{ top: 20, right: 30, left: 50, bottom: 5 }}>
                    <XAxis type="number" domain={['dataMin', 'dataMax']} />
                    <YAxis type="category" dataKey="rango" />
                    <Tooltip formatter={(value) => Math.abs(value)} />
                    <Legend />
                    <Bar dataKey="hombres" name="Hombres" fill="#1E88E5" />
                    <Bar dataKey="mujeres" name="Mujeres" fill="#E91E63" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="educacion">
          <Card>
            <CardContent className="pt-6">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byEducation} layout="vertical" margin={{ top: 20, right: 30, left: 50, bottom: 5 }}>
                    <XAxis type="number" domain={['dataMin', 'dataMax']} />
                    <YAxis type="category" dataKey="nivel" />
                    <Tooltip formatter={(value) => Math.abs(value)} />
                    <Legend />
                    <Bar dataKey="hombres" name="Hombres" fill="#1E88E5" />
                    <Bar dataKey="mujeres" name="Mujeres" fill="#E91E63" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actividad">
          <Card>
            <CardContent className="pt-6">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byActivity} layout="vertical" margin={{ top: 20, right: 30, left: 50, bottom: 5 }}>
                    <XAxis type="number" domain={['dataMin', 'dataMax']} />
                    <YAxis type="category" dataKey="actividad" />
                    <Tooltip formatter={(value) => Math.abs(value)} />
                    <Legend />
                    <Bar dataKey="hombres" name="Hombres" fill="#1E88E5" />
                    <Bar dataKey="mujeres" name="Mujeres" fill="#E91E63" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DemographicAnalysis;
