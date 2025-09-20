import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Brain, Shield, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import heroImage from '@/assets/hero.jpeg';
import PublicNavbar from '@/components/PublicNavbar';
import PageContainer from '@/components/layout/PageContainer';
const Home = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced AI algorithms analyze your documents in seconds, extracting key insights and identifying potential risks."
    },
    {
      icon: Shield,
      title: "Risk Assessment",
      description: "Comprehensive risk evaluation with color-coded highlights to help you make informed decisions."
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get detailed analysis and summaries instantly, saving hours of manual document review."
    }
  ];

  const contactInfo = {
    email: "contact@aidocanalyzer.com",
    phone: "+1 (555) 123-4567",
    address: "123 AI Street, Tech Valley, CA 94025"
  };

  const benefits = [
    "Automated document processing",
    "Multi-language support",
    "Real-time risk analysis",
    "Interactive AI chat assistance"
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <PageContainer>
          <div className="py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Intelligent
                <span className="text-primary"> Document Analysis</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Transform your document review process with AI-powered analysis. 
                Identify risks, extract insights, and make informed decisions faster than ever.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Analyzing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    View Demo
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                 key={benefit}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ 
                 duration: 0.8, 
                 delay: 1 + index * 0.15,
                 ease: "easeOut"
                 }}
                 className="flex items-center space-x-2"
                 >
                     <CheckCircle className="h-4 w-4 text-primary" />
                     <span className="text-sm text-muted-foreground">{benefit}</span>
                </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl overflow-hidden shadow-elevated">
                <img 
                  src={heroImage} 
                  alt="AI Document Analysis"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-accent/20 rounded-full blur-xl"></div>
            </motion.div>
          </div>
          </div>
        </PageContainer>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <PageContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to analyze documents efficiently and make informed decisions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-elevated transition-all duration-300 group">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <PageContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center bg-gradient-primary rounded-2xl p-12 text-primary-foreground"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Transform Your Document Analysis?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of professionals who trust AI DocAnalyzer for intelligent document processing.
            </p>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="text-primary">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </PageContainer>
      </section>

      {/* Footer */}
      <footer className="bg-muted">
        <PageContainer>
          <div className="py-8">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">
              © 2024 AI DocAnalyzer. Powered by advanced AI technology for intelligent document analysis.
            </p>
          </div>
          </div>
        </PageContainer>
      </footer>
    </div>
  );
};

export default Home;