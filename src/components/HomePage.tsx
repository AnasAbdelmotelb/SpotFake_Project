import { Shield, Zap, Lock, ArrowRight } from "lucide-react";

export default function HomePage({ setCurrentPage }: { setCurrentPage: (page: "analyze") => void }) {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        >
          <source src="https://videos.pexels.com/video-files/8566675/8566675-hd_1920_1080_30fps.mp4" type="video/mp4" />
        </video>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-fade-in">
            Detect Fake News with AI
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Advanced multimodal analysis combining text and image verification to identify misinformation with confidence
          </p>
          <button
            onClick={() => setCurrentPage("analyze")}
            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all inline-flex items-center space-x-2"
          >
            <span>Start Analyzing</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose SpotFake?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Cutting-edge AI technology to protect you from misinformation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield className="w-12 h-12 text-blue-600" />}
              title="Multimodal Analysis"
              description="Analyze both text content and images simultaneously for comprehensive fake news detection"
              image="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop"
            />
            <FeatureCard
              icon={<Zap className="w-12 h-12 text-purple-600" />}
              title="Instant Results"
              description="Get real-time analysis with confidence scores in seconds, powered by advanced AI models"
              image="https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&auto=format&fit=crop"
            />
            <FeatureCard
              icon={<Lock className="w-12 h-12 text-indigo-600" />}
              title="Secure & Private"
              description="Your data is protected with enterprise-grade security. We never share your analysis data"
              image="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&auto=format&fit=crop"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to verify news authenticity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Upload Content"
              description="Paste text or upload an image of the news article or social media post you want to verify"
            />
            <StepCard
              number="2"
              title="AI Analysis"
              description="Our advanced AI models analyze the content using natural language processing and computer vision"
            />
            <StepCard
              number="3"
              title="Get Results"
              description="Receive instant results with a confidence score indicating whether the content is real or fake"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Fight Misinformation?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust SpotFake to verify news authenticity
          </p>
          <button
            onClick={() => setCurrentPage("analyze")}
            className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all"
          >
            Start Free Analysis
          </button>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, image }: { icon: React.ReactNode; title: string; description: string; image: string }) {
  return (
    <div className="group rounded-2xl p-8 bg-gradient-to-b from-white to-gray-50 border border-gray-200 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all">
      <div className="mb-6 h-48 rounded-xl overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      <div className="mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative rounded-2xl p-8 bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
      <div className="absolute -top-6 left-8 w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
        {number}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3 mt-4">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
