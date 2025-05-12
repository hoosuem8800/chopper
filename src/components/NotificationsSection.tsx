
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Bell, CalendarClock, Zap, KeyRound } from 'lucide-react';

const NotificationsSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Notifications System</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Stay informed about your appointments, feature updates, and account changes with our customizable notification system.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-primary p-6">
            <h3 className="text-xl font-bold text-white">Notification Settings</h3>
            <p className="text-white/80">Customize how and when you receive notifications</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <CalendarClock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Appointment Reminders</h4>
                    <p className="text-sm text-gray-500">Get notified about upcoming appointments and changes</p>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                      "Your appointment is scheduled for [Date & Time]."
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Switch id="appointment-email" />
                  <label htmlFor="appointment-email" className="text-xs text-gray-500">Email</label>
                  <Switch id="appointment-app" defaultChecked />
                  <label htmlFor="appointment-app" className="text-xs text-gray-500">In-app</label>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="bg-secondary/10 p-2 rounded-full">
                    <Zap className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Feature Updates</h4>
                    <p className="text-sm text-gray-500">Receive updates about new features and improvements</p>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                      "New Premium Model feature unlocked!"
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Switch id="features-email" defaultChecked />
                  <label htmlFor="features-email" className="text-xs text-gray-500">Email</label>
                  <Switch id="features-app" defaultChecked />
                  <label htmlFor="features-app" className="text-xs text-gray-500">In-app</label>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <KeyRound className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Account Security</h4>
                    <p className="text-sm text-gray-500">Get alerts about password changes and account activities</p>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                      "Your password has been successfully updated."
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Switch id="security-email" defaultChecked />
                  <label htmlFor="security-email" className="text-xs text-gray-500">Email</label>
                  <Switch id="security-app" defaultChecked />
                  <label htmlFor="security-app" className="text-xs text-gray-500">In-app</label>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <p className="text-sm text-gray-600">
                You can customize your notification preferences at any time from your account settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotificationsSection;
