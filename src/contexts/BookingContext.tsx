import { createContext, useContext, useState, ReactNode } from 'react';
import { Service } from '../lib/supabase';

type Step = 'services' | 'calendar' | 'form' | 'payment' | 'confirmation';
type PaymentStatus = 'approved' | 'pending' | 'rejected' | null;

interface BookingData {
  date: Date | null;
  time: string;
  name: string;
  phone: string;
  email: string;
  preferenceId: string;
  bookingCode: string;
  paymentStatus: PaymentStatus;
  amount: number;
  currency: string;
  service: Service | null;
}

interface BookingContextType {
  step: Step;
  bookingData: BookingData;
  setStep: (step: Step) => void;
  setDate: (date: Date) => void;
  setTime: (time: string) => void;
  setCustomerInfo: (name: string, phone: string, email: string) => void;
  setPaymentInfo: (preferenceId: string, bookingCode: string, amount: number, currency: string) => void;
  setPaymentStatus: (status: PaymentStatus) => void;
  setSelectedService: (service: Service) => void;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | null>(null);

const INITIAL_BOOKING_DATA: BookingData = {
  date: null,
  time: '',
  name: '',
  phone: '',
  email: '',
  preferenceId: '',
  bookingCode: '',
  paymentStatus: null,
  amount: 0,
  currency: 'ARS',
  service: null,
};

export function BookingProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<Step>('services');
  const [bookingData, setBookingData] = useState<BookingData>(INITIAL_BOOKING_DATA);

  const setDate = (date: Date) =>
    setBookingData((prev) => ({ ...prev, date }));

  const setTime = (time: string) =>
    setBookingData((prev) => ({ ...prev, time }));

  const setCustomerInfo = (name: string, phone: string, email: string) =>
    setBookingData((prev) => ({ ...prev, name, phone, email }));

  const setPaymentInfo = (preferenceId: string, bookingCode: string, amount: number, currency: string) =>
    setBookingData((prev) => ({ ...prev, preferenceId, bookingCode, amount, currency }));

  const setPaymentStatus = (paymentStatus: PaymentStatus) =>
    setBookingData((prev) => ({ ...prev, paymentStatus }));

  const setSelectedService = (service: Service) =>
    setBookingData((prev) => ({ ...prev, service, amount: service.price, currency: service.currency }));

  const resetBooking = () => {
    setBookingData(INITIAL_BOOKING_DATA);
    setStep('services');
  };

  return (
    <BookingContext.Provider
      value={{ step, bookingData, setStep, setDate, setTime, setCustomerInfo, setPaymentInfo, setPaymentStatus, setSelectedService, resetBooking }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextType {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used within a BookingProvider');
  return context;
}
