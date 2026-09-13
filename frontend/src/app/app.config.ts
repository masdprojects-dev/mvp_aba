import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';

import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

import { getAuth, provideAuth } from '@angular/fire/auth';

import { routes } from './app.routes';

const firebaseConfig = {
  apiKey: 'AIzaSyCxjiVKuuOLuXd0Shx8VnXrERN6xXdaik4',
  authDomain: 'mvp-aba.firebaseapp.com',
  projectId: 'mvp-aba',
  storageBucket: 'mvp-aba.firebasestorage.app',
  messagingSenderId: '957242307939',
  appId: '1:957242307939:web:d7733a73fe23433d294f56',
  measurementId: 'G-CM631DW0MH',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),

    provideRouter(routes),
    provideHttpClient(),

    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
};