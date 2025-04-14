
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, Phone, MapPin } from 'lucide-react';

const ContactSection = () => {
  const { language } = useLanguage();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(language === 'ro' ? 'Mesaj trimis! Vă vom contacta în curând.' : 'Message sent! We will contact you soon.');
  };

  return (
    <section id="contact" className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          {language === 'ro' ? 'Contact' : 'Contact'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-xl font-bold mb-6">
              {language === 'ro' ? 'Trimite-ne un mesaj' : 'Send us a message'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {language === 'ro' ? 'Nume' : 'Name'}
                  </Label>
                  <Input id="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {language === 'ro' ? 'Email' : 'Email'}
                  </Label>
                  <Input id="email" type="email" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">
                  {language === 'ro' ? 'Subiect' : 'Subject'}
                </Label>
                <Input id="subject" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">
                  {language === 'ro' ? 'Mesaj' : 'Message'}
                </Label>
                <Textarea id="message" rows={5} required />
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                {language === 'ro' ? 'Trimite mesaj' : 'Send message'}
              </Button>
            </form>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6">
              {language === 'ro' ? 'Informații de contact' : 'Contact Information'}
            </h3>
            <div className="space-y-6">
              <div className="flex items-start">
                <Mail className="h-6 w-6 mr-4 text-automator-600 dark:text-automator-400" />
                <div>
                  <h4 className="font-semibold">
                    {language === 'ro' ? 'Email' : 'Email'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">contact@automator.ro</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="h-6 w-6 mr-4 text-automator-600 dark:text-automator-400" />
                <div>
                  <h4 className="font-semibold">
                    {language === 'ro' ? 'Telefon' : 'Phone'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">+40 700 000 000</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="h-6 w-6 mr-4 text-automator-600 dark:text-automator-400" />
                <div>
                  <h4 className="font-semibold">
                    {language === 'ro' ? 'Adresă' : 'Address'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === 'ro' 
                      ? 'Strada Exemplu, Nr. 1, București, România' 
                      : 'Example Street, No. 1, Bucharest, Romania'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h4 className="font-semibold mb-4">
                {language === 'ro' ? 'Program de lucru' : 'Working Hours'}
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'ro' 
                  ? 'Luni - Vineri: 09:00 - 18:00' 
                  : 'Monday - Friday: 09:00 - 18:00'}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'ro' 
                  ? 'Sâmbătă - Duminică: Închis' 
                  : 'Saturday - Sunday: Closed'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
