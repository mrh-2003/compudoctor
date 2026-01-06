import React from 'react';
import { Link } from 'react-router-dom';
import { FaMoneyBillWave, FaUserCog, FaChartPie, FaChartLine, FaClock, FaBoxes } from 'react-icons/fa';

function ReportesIndex() {
    const reports = [
        {
            title: 'Saldos Pendientes',
            description: 'Cuentas por cobrar, clientes con deuda y gestión de cobranza.',
            icon: <FaMoneyBillWave className="text-4xl text-red-500" />,
            link: '/reportes/saldos-pendientes',
            color: 'border-l-4 border-red-500'
        },
        {
            title: 'Productividad de Técnicos',
            description: 'Ranking de técnicos, tickets cerrados y eficiencia.',
            icon: <FaUserCog className="text-4xl text-blue-500" />,
            link: '/reportes/productividad-tecnicos',
            color: 'border-l-4 border-blue-500'
        },
        {
            title: 'Top Servicios y Fallas',
            description: 'Servicios más solicitados y diagnósticos comunes.',
            icon: <FaChartPie className="text-4xl text-purple-500" />,
            link: '/reportes/top-servicios',
            color: 'border-l-4 border-purple-500'
        },
        {
            title: 'Ingresos',
            description: 'Análisis financiero, ingresos brutos y operativos.',
            icon: <FaChartLine className="text-4xl text-green-500" />,
            link: '/reportes/ingresos',
            color: 'border-l-4 border-green-500'
        },
        {
            title: 'Tiempos de Resolución',
            description: 'Eficiencia operativa y tiempos promedio por área.',
            icon: <FaClock className="text-4xl text-orange-500" />,
            link: '/reportes/tiempos-resolucion',
            color: 'border-l-4 border-orange-500'
        },
        {
            title: 'Inventario de Entrada',
            description: 'Distribución de equipos por tipo y marca.',
            icon: <FaBoxes className="text-4xl text-teal-500" />,
            link: '/reportes/inventario-entrada',
            color: 'border-l-4 border-teal-500'
        }
    ];

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Panel de Reportes</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report, index) => (
                    <Link to={report.link} key={index} className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between ${report.color}`}>
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{report.title}</h2>
                                {report.icon}
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">{report.description}</p>
                        </div>
                        <div className="mt-auto">
                            <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Ver Reporte &rarr;</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default ReportesIndex;
