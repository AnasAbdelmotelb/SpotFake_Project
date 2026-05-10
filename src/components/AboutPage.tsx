import { Target, Users, Lightbulb, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            About SpotFake
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Empowering people with AI-driven tools to combat misinformation and protect truth in the digital age
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                In an era where misinformation spreads faster than truth, SpotFake stands as a guardian of authenticity. We leverage cutting-edge artificial intelligence to analyze both text and visual content, providing users with reliable verification tools.
              </p>
              <p className="text-lg text-gray-600 mb-4">
                Our multimodal approach combines natural language processing with computer vision, enabling comprehensive analysis that goes beyond simple fact-checking. We believe everyone deserves access to tools that help them distinguish fact from fiction.
              </p>
              <p className="text-lg text-gray-600">
                Whether you're a journalist, researcher, educator, or concerned citizen, SpotFake empowers you to make informed decisions based on verified information.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&auto=format&fit=crop"
                alt="AI Technology"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600">
              The principles that guide our work
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ValueCard
              icon={<Target className="w-10 h-10 text-blue-600" />}
              title="Accuracy"
              description="We prioritize precision in our AI models to deliver reliable results you can trust"
            />
            <ValueCard
              icon={<Users className="w-10 h-10 text-purple-600" />}
              title="Accessibility"
              description="Making advanced verification tools available to everyone, regardless of technical expertise"
            />
            <ValueCard
              icon={<Lightbulb className="w-10 h-10 text-indigo-600" />}
              title="Innovation"
              description="Continuously improving our technology to stay ahead of evolving misinformation tactics"
            />
            <ValueCard
              icon={<Award className="w-10 h-10 text-blue-600" />}
              title="Transparency"
              description="Clear explanations of how our AI works and the confidence levels behind each analysis"
            />
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Advanced AI Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              SpotFake uses state-of-the-art machine learning models trained on millions of verified and fake news samples
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TechCard
              title="Natural Language Processing"
              description="Our NLP models analyze text patterns, linguistic features, and semantic meaning to detect inconsistencies and manipulation tactics commonly used in fake news."
            />
            <TechCard
              title="Computer Vision"
              description="Advanced image analysis detects manipulated photos, deepfakes, and misleading visual content by examining metadata, compression artifacts, and visual anomalies."
            />
            <TechCard
              title="Multimodal Fusion"
              description="By combining text and image analysis, we achieve higher accuracy than single-mode systems, catching sophisticated misinformation that might fool traditional fact-checkers."
            />
            <TechCard
              title="Continuous Learning"
              description="Our models are regularly updated with new data to adapt to emerging misinformation techniques, ensuring you always have the most effective detection tools."
            />
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Built by Experts
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Our team combines expertise in artificial intelligence, journalism, and cybersecurity to create the most effective fake news detection platform available.
          </p>
          <div className="rounded-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
            <img
              src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop"
              alt="News and Media"
              className="w-full h-96 object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function ValueCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl p-8 bg-white border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function TechCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl p-8 bg-gradient-to-b from-white to-gray-50 border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
