import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useMembershipStatus } from "../hooks/useMembershipStatus";
import { FileText } from "lucide-react";

const Documents: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { isValidMember, isLoading: membershipLoading } = useMembershipStatus();

  const isAdmin = user?.isadmin === true;
  const hasAdminBypass = isAdmin && !isValidMember;

  // Show access restricted page for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Blue curved header section */}
        <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Documents</h1>
              <p className="text-xl opacity-90">
                Acces reserve aux membres du SRH
              </p>
            </div>
          </div>
          {/* Curved bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-20 bg-gray-50"
            style={{ clipPath: "ellipse(100% 100% at 50% 100%)" }}
          ></div>
        </section>

        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-srh-blue rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Acces Restreint
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Cette section est exclusivement reservee aux membres du Syndicat
                des Radiologues Hospitaliers.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-2">
                <strong>Vous n'etes pas encore membre ?</strong>
              </p>
              <p className="text-sm text-gray-600">
                Rejoignez le SRH pour acceder a nos ressources exclusives et
                beneficier de notre accompagnement professionnel.
              </p>
            </div>

            <button
              onClick={() => navigate("/jadhere-au-srh")}
              className="bg-srh-blue hover:bg-srh-blue-dark text-white px-8 py-3 rounded-md text-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              Adherer au SRH
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>

            <p className="text-sm text-gray-500 mt-4">
              Deja membre ?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-srh-blue hover:text-srh-blue-dark underline font-medium"
              >
                Connectez-vous ici
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while checking membership
  if (membershipLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-srh-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Verification de votre adhesion...</p>
        </div>
      </div>
    );
  }

  // Show payment required page for authenticated users without valid membership (except admins)
  if (!isValidMember && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Blue curved header section */}
        <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Documents</h1>
              <p className="text-xl opacity-90">
                Acces reserve aux membres actifs
              </p>
            </div>
          </div>
          {/* Curved bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-20 bg-gray-50"
            style={{ clipPath: "ellipse(100% 100% at 50% 100%)" }}
          ></div>
        </section>

        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Adhesion requise
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Votre compte est enregistre mais votre adhesion n'est pas
                active.
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-2">
                <strong>Completez votre adhesion</strong>
              </p>
              <p className="text-sm text-gray-600">
                Pour acceder aux documents reserves aux membres, veuillez
                finaliser votre adhesion en procedant au paiement de votre
                cotisation annuelle.
              </p>
            </div>

            <button
              onClick={() => navigate("/jadhere-au-srh")}
              className="bg-srh-blue hover:bg-srh-blue-dark text-white px-8 py-3 rounded-md text-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              Completer mon adhesion
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main content for valid members
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Documents</h1>
            <p className="text-xl opacity-90">
              Ressources et documents reserves aux membres
            </p>
          </div>
        </div>
        {/* Curved bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20 bg-gray-50"
          style={{ clipPath: "ellipse(100% 100% at 50% 100%)" }}
        ></div>
      </section>

      {/* Admin bypass warning */}
      {hasAdminBypass && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-amber-800">
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-sm font-medium">
                Acces administrateur : vous visualisez cette page sans adhesion
                active.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Contenu a venir
          </h2>
          <p className="text-gray-500">
            Cette section sera bientot enrichie avec des documents utiles pour
            les membres du SRH.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Documents;
