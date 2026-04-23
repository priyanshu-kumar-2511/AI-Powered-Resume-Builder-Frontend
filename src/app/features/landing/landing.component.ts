import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule, NavbarComponent],
  templateUrl: './landing.component.html'
})
export class LandingComponent {
  auth = inject(AuthService);

  features = [
    { icon: '🤖', title: 'AI-Powered Content', desc: 'Let our AI craft compelling bullet points and summaries tailored to your experience and target role.' },
    { icon: '🎨', title: 'Stunning Templates', desc: 'Choose from a curated library of ATS-optimised designs across five style categories.' },
    { icon: '📊', title: 'Job Match Score', desc: 'Instantly see how well your resume matches any job description with detailed gap analysis.' },
    { icon: '📄', title: 'One-Click Export', desc: 'Download your resume as a pixel-perfect PDF, ready to send to any employer.' },
    { icon: '🔔', title: 'Smart Notifications', desc: 'Stay informed with reminders to update your resume and alerts on job market trends.' },
    { icon: '🔒', title: 'Secure & Private', desc: 'Your data is encrypted and never shared. Full control over visibility and access.' }
  ];

  stats = [
    { value: '50K+', label: 'Resumes Created' },
    { value: '92%', label: 'Interview Rate' },
    { value: '200+', label: 'Templates' },
    { value: '4.9★', label: 'User Rating' }
  ];
}
