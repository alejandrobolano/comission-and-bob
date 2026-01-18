import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MembershipPage: React.FC = () => {
    const { user, goToCheckout, hasMembership, cancelPlan, checkMembershipStatus, resumePlan } = useAuth();
    const navigate = useNavigate();

    const periodEnd = user?.currentPeriodEnd
        ? new Date(user.currentPeriodEnd * 1000)
        : null;

    const periodEndText = periodEnd
        ? periodEnd.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
        : "";
    const isPendingCancel = user?.membershipStatus === "pending";

    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Actualiza Tu Membresía</h1>
                <p className="text-lg text-slate-600">Accede a todas las funcionalidades premium de Commission Auditor</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="border-2 border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Plan Básico</h3>
                    <p className="text-slate-600 mb-6">Acceso limitado</p>
                    <p className="text-4xl font-bold text-slate-900 mb-6">
                        Gratis
                    </p>
                    <ul className="space-y-3 mb-8">
                        <li className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-slate-600">Ver resumen de datos</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span className="text-slate-400 line-through">Acceso a tabla de registros</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span className="text-slate-400 line-through">Exportar a Excel</span>
                        </li>
                    </ul>
                    {user?.membershipStatus === "inactive" && (
                        <button
                            disabled
                            className="w-full py-3 bg-slate-100 text-slate-400 rounded-lg font-bold cursor-not-allowed"
                        >
                            Plan Actual
                        </button>
                    )}

                    {user?.membershipStatus === "active" && (
                        <button
                            onClick={async () => {
                                await cancelPlan();
                                await checkMembershipStatus();
                            }}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                        >
                            Cancelar plan
                        </button>
                    )}

                    {user?.membershipStatus === "pending" && (
                        <>
                            <button
                                disabled
                                className="w-full py-3 bg-slate-200 text-slate-500 rounded-lg font-bold cursor-not-allowed"
                            >
                                Cancelación programada
                            </button>

                            {periodEndText && (
                                <p className="mt-3 text-sm text-slate-600">
                                    Tu plan seguirá activo hasta <b>{periodEndText}</b>.
                                </p>
                            )}
                        </>
                    )}

                </div>

                <div className="border-2 border-blue-600 rounded-2xl p-8 bg-blue-50 shadow-lg relative">
                    <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-lg text-sm font-bold">
                        RECOMENDADO
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Plan Premium</h3>
                    <p className="text-slate-600 mb-6">Acceso completo a todas las funcionalidades</p>
                    <p className="text-4xl font-bold text-blue-600 mb-2">$9.99</p>
                    <p className="text-slate-600 text-sm mb-6">/mes</p>
                    <ul className="space-y-3 mb-8">
                        <li className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-slate-900 font-medium">Ver resumen de datos</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-slate-900 font-medium">Acceso completo a tabla de registros</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-slate-900 font-medium">Exportar a Excel ilimitado</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-slate-900 font-medium">Soporte prioritario</span>
                        </li>
                    </ul>

                    {hasMembership ? (
                        isPendingCancel ? (
                            <button
                                onClick={async () => {
                                    await resumePlan();
                                    await checkMembershipStatus();
                                }}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                            >
                                Reactivar suscripción
                            </button>
                        ) : (
                            <button
                                disabled
                                className="w-full py-2 bg-slate-100 text-slate-400 rounded-lg font-bold cursor-not-allowed"
                            >
                                Plan Actual
                            </button>
                        )
                    ) : (
                        <button
                            onClick={goToCheckout}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                        >
                            Actualizar Ahora
                        </button>
                    )}

                </div>
            </div>

        </div>
    );
};

export default MembershipPage;
