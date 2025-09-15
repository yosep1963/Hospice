import React, { useEffect } from 'react';
import {
  Heart,
  Shield,
  Users,
  MessageSquare,
  FileText,
  Clock,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

const AboutPage: React.FC = () => {
  useEffect(() => {
    document.title = 'About - Hospice Care Assistant';

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content',
        'Learn about our Hospice Care Assistant - a compassionate AI-powered tool designed to provide support, guidance, and information for hospice care patients and families.'
      );
    }
  }, []);

  const features = [
    {
      icon: MessageSquare,
      title: 'Compassionate AI Support',
      description: 'Get instant answers to questions about hospice care, pain management, and emotional support.'
    },
    {
      icon: FileText,
      title: 'Document Management',
      description: 'Securely upload and manage medical documents, care plans, and important paperwork.'
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Your information is protected with enterprise-grade security and HIPAA compliance.'
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Access support and information whenever you need it, day or night.'
    }
  ];

  const supportResources = [
    {
      title: 'National Hospice and Palliative Care Organization',
      description: 'Comprehensive resources and support for patients and families.',
      website: 'https://www.nhpco.org',
      phone: '1-800-658-8898'
    },
    {
      title: 'Hospice Foundation of America',
      description: 'Educational resources and grief support services.',
      website: 'https://hospicefoundation.org',
      phone: '1-800-854-3402'
    },
    {
      title: 'American Cancer Society',
      description: 'Cancer support and information resources.',
      website: 'https://www.cancer.org',
      phone: '1-800-227-2345'
    },
    {
      title: 'Family Caregiver Alliance',
      description: 'Support and resources for family caregivers.',
      website: 'https://www.caregiver.org',
      phone: '1-800-445-8106'
    }
  ];

  const faqs = [
    {
      question: 'What is this Hospice Care Assistant?',
      answer: 'This is an AI-powered assistant designed to provide compassionate support, information, and guidance for individuals and families navigating hospice care. It can answer questions about pain management, emotional support, care procedures, and help organize important documents.'
    },
    {
      question: 'Is my information secure and private?',
      answer: 'Yes, absolutely. We use enterprise-grade encryption and follow HIPAA compliance standards to protect your personal and medical information. Your conversations and documents are kept strictly confidential.'
    },
    {
      question: 'Can this replace my healthcare provider?',
      answer: 'No, this assistant is designed to supplement, not replace, your healthcare team. Always consult with your doctors, nurses, and hospice care professionals for medical decisions and emergencies.'
    },
    {
      question: 'What types of documents can I upload?',
      answer: 'You can upload various document types including PDFs, text files, Word documents, and images (PNG, JPG, GIF). Common documents include care plans, medication lists, advance directives, and medical records.'
    },
    {
      question: 'How accurate is the information provided?',
      answer: 'The assistant is trained on reliable medical and hospice care information, but responses should be verified with your healthcare team. It provides general guidance and support, not specific medical advice.'
    },
    {
      question: 'Is this service free to use?',
      answer: 'The basic features of the Hospice Care Assistant are free to use. We believe everyone deserves access to compassionate support during difficult times.'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <a
              href="/chat"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Back to chat"
              aria-label="Back to chat"
            >
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">About</h1>
              <p className="text-sm text-gray-500">
                Hospice Care Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="/chat"
              className="btn btn-primary"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Start Chat
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-8">
        {/* Hero Section */}
        <section className="text-center py-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Hospice Care Assistant
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A compassionate AI-powered companion designed to provide support, guidance,
            and information for individuals and families navigating hospice care.
            We're here to help you find comfort and clarity during this important journey.
          </p>
        </section>

        {/* Features */}
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How We Can Help
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="card">
                <div className="card-body">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h4>
                      <p className="text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Important Notice */}
        <section>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-lg font-semibold text-amber-800 mb-2">
                  Important Notice
                </h4>
                <p className="text-amber-700 mb-2">
                  This assistant is designed to provide general information and emotional support.
                  It is not a substitute for professional medical care, diagnosis, or treatment.
                </p>
                <ul className="list-disc list-inside text-amber-700 space-y-1">
                  <li>Always consult with your healthcare team for medical decisions</li>
                  <li>In case of emergency, call 911 or your local emergency services</li>
                  <li>Contact your hospice care team for urgent care needs</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="card">
                <summary className="card-header cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900">
                      {faq.question}
                    </h4>
                    <Info className="w-5 h-5 text-gray-400" />
                  </div>
                </summary>
                <div className="card-body border-t border-gray-200">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Support Resources */}
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Additional Support Resources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {supportResources.map((resource, index) => (
              <div key={index} className="card">
                <div className="card-body">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {resource.title}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    {resource.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a
                        href={`tel:${resource.phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {resource.phone}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400" />
                      <a
                        href={resource.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Visit Website
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy & Security */}
        <section>
          <div className="card">
            <div className="card-header">
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  Privacy & Security
                </h3>
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">HIPAA Compliant</h4>
                  <p className="text-sm text-gray-600">
                    Meets healthcare privacy standards
                  </p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Encrypted Data</h4>
                  <p className="text-sm text-gray-600">
                    End-to-end encryption protection
                  </p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Secure Storage</h4>
                  <p className="text-sm text-gray-600">
                    Enterprise-grade data security
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Support */}
        <section>
          <div className="card">
            <div className="card-header text-center">
              <h3 className="text-xl font-bold text-gray-900">
                Need Additional Support?
              </h3>
            </div>
            <div className="card-body text-center">
              <p className="text-gray-600 mb-6">
                If you have questions about using this assistant or need technical support,
                we're here to help.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6">
                <a
                  href="mailto:support@hospiceassistant.com"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <Mail className="w-5 h-5" />
                  <span>support@hospiceassistant.com</span>
                </a>
                <a
                  href="tel:1-800-HOSPICE"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <Phone className="w-5 h-5" />
                  <span>1-800-HOSPICE</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            © 2024 Hospice Care Assistant. Built with compassion for those who need support most.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;