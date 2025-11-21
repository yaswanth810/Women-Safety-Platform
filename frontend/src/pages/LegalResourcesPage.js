import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { BookOpen, Search, FileText, Scale, Shield } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';

const LegalResourcesPage = ({ user, onLogout }) => {
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await axios.get(`${API}/legal/resources`);
      setResources(response.data);
      
      // If no resources, add default ones for demo
      if (response.data.length === 0) {
        setResources(defaultResources);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources(defaultResources);
    }
  };

  const defaultResources = [
    {
      id: '1',
      title: 'Understanding Your Rights',
      category: 'Rights',
      content: `Every individual has fundamental rights to safety and dignity. Key rights include:

1. Right to Safety: You have the right to live free from violence and fear.
2. Right to Privacy: Your personal information and experiences are confidential.
3. Right to Legal Representation: You can seek legal counsel for any incident.
4. Right to Report: You can report incidents to authorities anonymously or with your identity.
5. Right to Protection: Law enforcement must take measures to protect you from further harm.

If any of these rights are violated, you have legal recourse to seek justice and protection.`
    },
    {
      id: '2',
      title: 'Filing a Police Complaint',
      category: 'Procedures',
      content: `Steps to file a police complaint:

1. Visit the nearest police station or call emergency services (911).
2. Provide a detailed account of the incident including date, time, and location.
3. Bring any evidence you have (photos, videos, messages).
4. Request a copy of the FIR (First Information Report).
5. Note down the complaint number for future reference.
6. Follow up regularly on the status of your complaint.

You can also file complaints online through your local police department's website.`
    },
    {
      id: '3',
      title: 'Restraining Orders',
      category: 'Legal Actions',
      content: `A restraining order (also called a protection order) is a legal order that:

- Prohibits someone from contacting or approaching you
- Can include protection for family members
- Violations can result in arrest and criminal charges

How to obtain:
1. File a petition at your local courthouse
2. Attend a hearing (usually within 10-15 days)
3. Present evidence of harassment or threat
4. If granted, the order is typically valid for 1-5 years

Emergency orders can be obtained within 24 hours in urgent situations.`
    },
    {
      id: '4',
      title: 'Domestic Violence Resources',
      category: 'Support',
      content: `If you're experiencing domestic violence:

**Immediate Actions:**
- Call emergency services (911) if in immediate danger
- Seek shelter at a domestic violence center
- Document all incidents with dates and details

**Long-term Support:**
- Contact National Domestic Violence Hotline: 1-800-799-7233
- Seek counseling and therapy services
- Connect with support groups
- Create a safety plan for leaving

**Legal Options:**
- File for restraining order
- Pursue criminal charges
- Seek divorce or separation if married
- Request custody protection for children`
    },
    {
      id: '5',
      title: 'Workplace Harassment Laws',
      category: 'Workplace',
      content: `Workplace harassment is illegal under federal and state laws:

**What Constitutes Harassment:**
- Unwelcome sexual advances or requests
- Offensive comments about gender, race, religion, etc.
- Physical harassment or assault
- Creating a hostile work environment

**Your Rights:**
- Right to work in harassment-free environment
- Protection from retaliation for reporting
- Right to file complaint with HR or EEOC

**Steps to Take:**
1. Document all incidents in detail
2. Report to HR or supervisor
3. File formal complaint with company
4. If unresolved, file with EEOC (Equal Employment Opportunity Commission)
5. Consider legal action with employment attorney`
    },
    {
      id: '6',
      title: 'Cyberstalking and Online Harassment',
      category: 'Cyber Safety',
      content: `Online harassment and cyberstalking are crimes:

**What is Cyberstalking:**
- Repeated unwanted online contact
- Threatening messages or posts
- Sharing private information (doxxing)
- Creating fake profiles to harass

**Protective Measures:**
- Document all communications (screenshots)
- Block the harasser on all platforms
- Report to platform administrators
- Enable two-factor authentication
- Review and tighten privacy settings

**Legal Action:**
- File police report (cyberstalking is criminal)
- Seek restraining order
- Contact FBI's Internet Crime Complaint Center (IC3)
- Consult with attorney about civil lawsuit`
    }
  ];

  const categories = ['all', ...new Set(resources.map(r => r.category))];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category) => {
    const icons = {
      'Rights': Shield,
      'Procedures': FileText,
      'Legal Actions': Scale,
      'Support': BookOpen,
      'Workplace': FileText,
      'Cyber Safety': Shield
    };
    return icons[category] || BookOpen;
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-8" data-testid="legal-resources-page">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Legal Resources
              </h1>
              <p className="text-gray-600">Access legal information and guidance</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-resources-input"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
                data-testid={`category-${category}-button`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Resources */}
        {filteredResources.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No resources found</p>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {filteredResources.map((resource, index) => {
              const CategoryIcon = getCategoryIcon(resource.category);
              return (
                <AccordionItem
                  key={resource.id}
                  value={resource.id}
                  className="border-none"
                >
                  <Card className="card-hover" data-testid="resource-card">
                    <AccordionTrigger className="hover:no-underline px-6 py-4">
                      <CardHeader className="p-0 w-full">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <CategoryIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-left flex-1">
                            <CardTitle className="text-lg mb-1">{resource.title}</CardTitle>
                            <CardDescription className="text-xs">
                              {resource.category}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <CardContent className="p-0">
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                          {resource.content}
                        </div>
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {/* Emergency Notice */}
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-rose-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-red-900">In Case of Emergency</CardTitle>
                <CardDescription className="text-red-700">
                  If you are in immediate danger, call emergency services (911) or use the SOS feature in this app.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </Layout>
  );
};

export default LegalResourcesPage;