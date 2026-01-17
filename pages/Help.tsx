
import React from 'react';
import Accordion from '../components/Accordion';

const HelpPage: React.FC = () => {
  const handleDownload = (filePath: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = filePath;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sections = [
    {
      id: 'video',
      title: '1. Video: Tus Informes Cuadran a la Perfección',
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 text-sm leading-relaxed">
            Descubre cómo nuestra herramienta garantiza que todos tus informes de comisiones cuadren perfectamente. 
            Mira en acción cómo automatizamos la reconciliación financiera.
          </p>
          <div className="w-full rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-black">
            <video
              controls
              className="w-full h-auto"
              style={{ minHeight: '400px' }}
            >
              <source src="/assets/Tus informes cuadran a la perfección.mp4" type="video/mp4" />
              Tu navegador no soporta la reproducción de video.
            </video>
          </div>
        </div>
      )
    },
    {
      id: 'presentation',
      title: '2. Presentación: Auditoría Financiera Inteligente',
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 text-sm leading-relaxed">
            Esta presentación detalla el costo real de las discrepancias financieras y cómo nuestra herramienta 
            transforma el caos de la reconciliación manual en control absoluto.
          </p>
          <div className="w-full rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
            <iframe
              src="/assets/Auditoría_Inteligente_para_Ingresos_de_Seguros.pdf"
              className="w-full"
              style={{ height: '600px' }}
              title="Auditoría Inteligente para Ingresos de Seguros"
            />
          </div>
          <div className="flex justify-end">
            <button 
              onClick={() => handleDownload('/assets/Auditoría_Inteligente_para_Ingresos_de_Seguros.pdf', 'Auditoría_Inteligente_para_Ingresos_de_Seguros.pdf')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar Presentación (PDF)
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'general-infographic',
      title: '3. Infografía: Tu Herramienta de Auditoría Financiera',
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 text-sm leading-relaxed">
            Resumen visual de las 3 etapas clave: Carga de Datos, Procesamiento Inteligente y Análisis/Reporte. 
            Muestra el flujo desde el Book of Business hasta el Dashboard interactivo.
          </p>
          <div className="relative overflow-hidden rounded-xl border-2 border-slate-200 shadow-lg bg-white">
            <img 
              src="/assets/comission and bob (Tu Herramienta de Auditoría Financiera).png"
              alt="Tu Herramienta de Auditoría Financiera"
              className="w-full h-auto"
            />
          </div>
          <div className="flex justify-end">
            <button 
              onClick={() => handleDownload('/assets/comission and bob (Tu Herramienta de Auditoría Financiera).png', 'comission_and_bob_Herramienta_Auditoria.png')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar Infografía (Imagen)
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'process-infographic',
      title: '4. Infografía: El Proceso de Reconciliación',
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 text-sm leading-relaxed">
            Detalle paso a paso del flujo de trabajo: Carga de archivos flexibles, reconciliación automática por número de póliza, 
            cálculo preciso de comisiones y exportación organizada en pestañas.
          </p>
          <div className="relative overflow-hidden rounded-xl border-2 border-slate-200 shadow-lg bg-white">
            <img 
              src="/assets/comission and bob (El Proceso de Reconciliacion).png"
              alt="El Proceso de Reconciliación"
              className="w-full h-auto"
            />
          </div>
          <div className="flex justify-end">
            <button 
              onClick={() => handleDownload('/assets/comission and bob (El Proceso de Reconciliacion).png', 'El_Proceso_de_Reconciliacion.png')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 transition-all shadow-md active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar Infografía (Imagen)
            </button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">Centro de Ayuda y Documentación</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Consulta y descarga los materiales de soporte oficial para dominar la auditoría de comisiones.
        </p>
      </div>
      
      <Accordion items={sections} />
      
      <div className="mt-16 p-8 bg-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold mb-2">Asistencia Personalizada</h3>
            <p className="text-slate-400">¿Necesitas ayuda con un archivo específico? Contacta a nuestro equipo de soporte.</p>
          </div>
          <div className="flex-shrink-0">
             <a 
              href="mailto:support@smarttechlite.com"
              className="bg-white text-slate-900 px-6 py-3 rounded-xl text-sm font-black hover:bg-blue-50 transition-colors inline-block"
             >
               Contactar Soporte
             </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
