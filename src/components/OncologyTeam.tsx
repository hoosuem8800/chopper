
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface DoctorProps {
  name: string;
  title: string;
  credentials: string[];
  image: string;
}

const DoctorCard = ({ name, title, credentials, image }: DoctorProps) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto mb-4 overflow-hidden">
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-xl font-bold mb-1">{name}</h3>
        <p className="text-primary mb-3">{title}</p>
        <div className="mb-4">
          {credentials.map((credential, index) => (
            <p key={index} className="text-gray-600 text-sm">{credential}</p>
          ))}
        </div>
        <Button variant="outline" className="mt-2 border-primary text-primary hover:bg-primary/10">
          Profile
        </Button>
      </div>
    </div>
  );
};

const OncologyTeam = () => {
  const doctors = [
    {
      name: "Dr. Sarah Johnson",
      title: "Medical Oncologist",
      credentials: [
        "15+ years experience",
        "Harvard Medical School"
      ],
      image: "/placeholder.svg"
    },
    {
      name: "Dr. Michael Chen",
      title: "Radiologist",
      credentials: [
        "MIT MedTech Researcher",
        "Board Certified"
      ],
      image: "/placeholder.svg"
    },
    {
      name: "Dr. Emma Wilson",
      title: "Radiation Oncologist",
      credentials: [
        "Patient Education",
        "Precision Treatment"
      ],
      image: "/placeholder.svg"
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Our Oncology Team
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {doctors.map((doctor, index) => (
            <DoctorCard 
              key={index}
              name={doctor.name}
              title={doctor.title}
              credentials={doctor.credentials}
              image={doctor.image}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default OncologyTeam;
