"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface InfoField {
  id: string;
  label: string;
  value: string;
}

interface ExpenseItem {
  id: string;
  name: string;
  price: number;
  isPerPerson: boolean;
  infoFields: InfoField[];
}

interface BasicInfoField {
  id: string;
  label: string;
  value: string;
}

interface TripData {
  tripName: string;
  persons: number;
  budgetPerPerson: number;
  hasAccommodation: boolean;
  accommodationLink: string;
  accommodationPrice: number;
  accommodationNights: number;
  basicInfo: BasicInfoField[];
  expenses: ExpenseItem[];
}

const EXPENSE_PLACEHOLDERS = [
  "The Villa",
  "Flight Tickets",
  "Road Trip",
  "Fine Dining",
  "Mountain Lodge",
  "Boat Rental",
  "Ski Passes",
  "Concert Tickets",
  "Spa Day",
  "Wine Tasting",
  "City Tour",
  "Beach House",
  "Train Passes",
  "Helicopter Ride",
  "Cooking Class",
];

function getRandomPlaceholder(): string {
  return EXPENSE_PLACEHOLDERS[Math.floor(Math.random() * EXPENSE_PLACEHOLDERS.length)];
}

// Animated number component with blur effect using CSS
function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValue = useRef(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (previousValue.current === value) return;

    const startValue = previousValue.current;
    const endValue = value;
    const duration = 400;
    const startTime = performance.now();

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Animation requires synchronous state for smooth transitions
    setIsAnimating(true);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);

  return (
    <span
      className={`inline-block transition-all duration-200 ${isAnimating ? 'blur-[1px] scale-105' : 'blur-0 scale-100'}`}
    >
      {prefix}{displayValue.toFixed(2)}
    </span>
  );
}

function getInitialData(): TripData {
  const defaultData: TripData = {
    tripName: "",
    persons: 2,
    budgetPerPerson: 0,
    hasAccommodation: false,
    accommodationLink: "",
    accommodationPrice: 0,
    accommodationNights: 1,
    basicInfo: [],
    expenses: []
  };

  if (typeof window === "undefined") {
    return defaultData;
  }
  const saved = localStorage.getItem("bros-and-bills");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      // Migrate old data format to include infoFields
      if (data.expenses) {
        data.expenses = data.expenses.map((expense: ExpenseItem & { link?: string; notes?: string }) => ({
          ...expense,
          infoFields: expense.infoFields || [
            // Migrate old link/notes to infoFields
            ...(expense.link ? [{ id: crypto.randomUUID(), label: "Link", value: expense.link }] : []),
            ...(expense.notes ? [{ id: crypto.randomUUID(), label: "Notes", value: expense.notes }] : []),
          ],
        }));
      }
      return { ...defaultData, ...data };
    } catch {
      return defaultData;
    }
  }
  return defaultData;
}

export default function Home() {
  const [tripName, setTripName] = useState("");
  const [persons, setPersons] = useState(2);
  const [budgetPerPerson, setBudgetPerPerson] = useState(0);
  const [hasAccommodation, setHasAccommodation] = useState(false);
  const [accommodationLink, setAccommodationLink] = useState("");
  const [accommodationPrice, setAccommodationPrice] = useState(0);
  const [accommodationNights, setAccommodationNights] = useState(1);
  const [basicInfo, setBasicInfo] = useState<BasicInfoField[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const billRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
   
  useEffect(() => {
    const data = getInitialData();
    setTripName(data.tripName);
    setPersons(data.persons);
    setBudgetPerPerson(data.budgetPerPerson);
    setHasAccommodation(data.hasAccommodation);
    setAccommodationLink(data.accommodationLink);
    setAccommodationPrice(data.accommodationPrice || 0);
    setAccommodationNights(data.accommodationNights || 1);
    setBasicInfo(data.basicInfo || []);
    setExpenses(data.expenses);
    setIsLoaded(true);
  }, []);
   

  // Auto-save when data changes
   
  useEffect(() => {
    if (!isLoaded) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const data: TripData = { tripName, persons, budgetPerPerson, hasAccommodation, accommodationLink, accommodationPrice, accommodationNights, basicInfo, expenses };
      localStorage.setItem("bros-and-bills", JSON.stringify(data));
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [tripName, persons, budgetPerPerson, hasAccommodation, accommodationLink, accommodationPrice, accommodationNights, basicInfo, expenses, isLoaded]);
   

  const addExpense = () => {
    setExpenses([
      ...expenses,
      {
        id: crypto.randomUUID(),
        name: getRandomPlaceholder(),
        price: 0,
        isPerPerson: false,
        infoFields: [],
      },
    ]);
  };

  const updateExpense = (id: string, field: keyof ExpenseItem, value: string | number | boolean | InfoField[]) => {
    setExpenses(
      expenses.map((expense) =>
        expense.id === id ? { ...expense, [field]: value } : expense
      )
    );
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id));
  };

  const addInfoField = (expenseId: string) => {
    setExpenses(
      expenses.map((expense) =>
        expense.id === expenseId
          ? {
              ...expense,
              infoFields: [
                ...expense.infoFields,
                { id: crypto.randomUUID(), label: "", value: "" },
              ],
            }
          : expense
      )
    );
  };

  const updateInfoField = (expenseId: string, fieldId: string, key: "label" | "value", value: string) => {
    setExpenses(
      expenses.map((expense) =>
        expense.id === expenseId
          ? {
              ...expense,
              infoFields: expense.infoFields.map((field) =>
                field.id === fieldId ? { ...field, [key]: value } : field
              ),
            }
          : expense
      )
    );
  };

  const removeInfoField = (expenseId: string, fieldId: string) => {
    setExpenses(
      expenses.map((expense) =>
        expense.id === expenseId
          ? {
              ...expense,
              infoFields: expense.infoFields.filter((field) => field.id !== fieldId),
            }
          : expense
      )
    );
  };

  const addBasicInfoField = () => {
    setBasicInfo([...basicInfo, { id: crypto.randomUUID(), label: "", value: "" }]);
  };

  const updateBasicInfoField = (fieldId: string, key: "label" | "value", value: string) => {
    setBasicInfo(
      basicInfo.map((field) =>
        field.id === fieldId ? { ...field, [key]: value } : field
      )
    );
  };

  const removeBasicInfoField = (fieldId: string) => {
    setBasicInfo(basicInfo.filter((field) => field.id !== fieldId));
  };

  const getExpenseTotal = (expense: ExpenseItem) => {
    return expense.isPerPerson ? expense.price * persons : expense.price;
  };

  const expensesCost = expenses.reduce((sum, expense) => sum + getExpenseTotal(expense), 0);
  const accommodationCost = hasAccommodation ? accommodationPrice : 0;
  const totalCost = expensesCost + accommodationCost;
  const costPerPerson = persons > 0 ? totalCost / persons : 0;
  const pricePerNight = accommodationNights > 0 ? accommodationPrice / accommodationNights : 0;
  const totalBudget = budgetPerPerson * persons;
  const remaining = totalBudget - totalCost;

  const downloadScreenshot = useCallback(async () => {
    if (!billRef.current || isDownloading) return;

    setIsDownloading(true);
    setIsCapturing(true);

    // Wait for state to update and re-render
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const dataUrl = await toPng(billRef.current, {
        backgroundColor: "#171717",
        pixelRatio: 2,
        skipFonts: true,
      });

      const link = document.createElement("a");
      link.download = `${(tripName || "trip").toLowerCase().replace(/\s+/g, "-")}-summary.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Screenshot downloaded");
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
      toast.error("Failed to capture screenshot");
    } finally {
      setIsCapturing(false);
      setIsDownloading(false);
    }
  }, [tripName, isDownloading]);

  const exportData = () => {
    const data: TripData = { tripName, persons, budgetPerPerson, hasAccommodation, accommodationLink, accommodationPrice, accommodationNights, basicInfo, expenses };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${(tripName || "trip").toLowerCase().replace(/\s+/g, "-")}-backup.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Trip exported successfully");
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as TripData;
        setTripName(data.tripName || "");
        setPersons(data.persons || 2);
        setBudgetPerPerson(data.budgetPerPerson || 0);
        setHasAccommodation(data.hasAccommodation || false);
        setAccommodationLink(data.accommodationLink || "");
        setBasicInfo(data.basicInfo || []);
        // Migrate expenses if needed
        const migratedExpenses = (data.expenses || []).map((expense: ExpenseItem & { link?: string; notes?: string }) => ({
          ...expense,
          infoFields: expense.infoFields || [
            ...(expense.link ? [{ id: crypto.randomUUID(), label: "Link", value: expense.link }] : []),
            ...(expense.notes ? [{ id: crypto.randomUUID(), label: "Notes", value: expense.notes }] : []),
          ],
        }));
        setExpenses(migratedExpenses);
        toast.success("Trip imported successfully");
      } catch {
        toast.error("Failed to import file");
      }
    };
    reader.readAsText(file);
    // Reset the input
    event.target.value = "";
  };

  const copyToClipboard = () => {
    const name = tripName || "Trip";
    let summary = `*${name}* 🏝️\n\n`;
    summary += `👥 ${persons} people\n\n`;

    // Basic Info
    const filledBasicInfo = basicInfo.filter(f => f.label || f.value);
    if (filledBasicInfo.length > 0) {
      summary += `📋 *Basic Info*\n`;
      filledBasicInfo.forEach((field) => {
        summary += `• ${field.label || "Info"}: ${field.value}\n`;
      });
      summary += `\n`;
    }

    // Accommodation
    if (hasAccommodation && accommodationPrice > 0) {
      summary += `🏨 *Accommodation*\n`;
      summary += `• Stay: CHF ${accommodationPrice.toFixed(2)}`;
      summary += ` (${accommodationNights} ${accommodationNights === 1 ? "night" : "nights"} × CHF ${pricePerNight.toFixed(2)})\n`;
      if (accommodationLink) {
        summary += `  _Link:_ ${accommodationLink}\n`;
      }
      summary += `\n`;
    }

    // Expenses
    if (expenses.length > 0) {
      summary += `💳 *Expenses*\n`;
    }
    expenses.forEach((expense) => {
      const total = getExpenseTotal(expense);
      summary += `• ${expense.name || "Unnamed"}: CHF ${total.toFixed(2)}`;
      if (expense.isPerPerson) {
        summary += ` (CHF ${expense.price.toFixed(2)}/person)`;
      }
      const filledFields = expense.infoFields?.filter(f => f.label || f.value) || [];
      if (filledFields.length > 0) {
        filledFields.forEach((field) => {
          summary += `\n  ${field.label ? `_${field.label}:_ ` : ""}${field.value}`;
        });
      }
      summary += `\n`;
    });

    summary += `\n💰 *Total: CHF ${totalCost.toFixed(2)}*\n`;
    summary += `👤 *Per person: CHF ${costPerPerson.toFixed(2)}*`;

    if (budgetPerPerson > 0 && remaining >= 0) {
      summary += `\n✅ Under budget by CHF ${remaining.toFixed(2)}`;
    } else if (budgetPerPerson > 0) {
      summary += `\n⚠️ Over budget by CHF ${Math.abs(remaining).toFixed(2)}`;
    }

    navigator.clipboard.writeText(summary);
    toast.success("Copied to clipboard");
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-12 text-center relative">
          <h1 className="font-serif text-5xl lg:text-6xl tracking-tight text-foreground mb-3">
            Bros & <i> Bills</i>
          </h1>
          <p className="text-muted-foreground text-lg">
            Plan your adventures together
          </p>
          {/* Import/Export Controls */}
          <div className="absolute top-0 right-0 flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={importData}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Import
            </button>
            <span className="text-muted-foreground/30">|</span>
            <button
              onClick={exportData}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Export
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* TRIP DETAILS Section */}
            <div className="space-y-4">
              <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">Trip Details</h2>
              <div className={`grid gap-4 ${hasAccommodation ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Trip Info Card */}
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-black/5">
                  <CardHeader className="pb-4">
                    <CardTitle className="font-serif text-2xl">Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="tripName" className="text-sm font-medium text-muted-foreground">
                        Trip Name
                      </Label>
                      <Input
                        id="tripName"
                        placeholder="Summer in Italy"
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        className="h-12 text-lg bg-background/50 border-border/50 transition-all duration-200 focus:border-foreground/30 focus:bg-background"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="persons" className="text-sm font-medium text-muted-foreground">
                          Travelers
                        </Label>
                        <Input
                          id="persons"
                          type="number"
                          min={1}
                          value={persons}
                          onChange={(e) => setPersons(parseInt(e.target.value) || 1)}
                          className="h-12 text-lg font-sans tabular-nums bg-background/50 border-border/50 transition-all duration-200 focus:border-foreground/30 focus:bg-background"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="budget" className="text-sm font-medium text-muted-foreground">
                          Budget / Person
                        </Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">CHF</span>
                          <Input
                            id="budget"
                            type="number"
                            min={0}
                            value={budgetPerPerson || ""}
                            onChange={(e) => setBudgetPerPerson(parseFloat(e.target.value) || 0)}
                            className="h-12 text-lg pl-14 font-sans tabular-nums bg-background/50 border-border/50 transition-all duration-200 focus:border-foreground/30 focus:bg-background"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                    {/* Quick Options */}
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">Accommodation?</Label>
                        <Switch
                          checked={hasAccommodation}
                          onCheckedChange={setHasAccommodation}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Accommodation Card - shown when toggle is on */}
                {hasAccommodation && (
                  <Card className="border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-black/5 animate-in fade-in slide-in-from-right-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="font-serif text-2xl">Accommodation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-muted-foreground">
                            Total Price
                          </Label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">CHF</span>
                            <Input
                              type="number"
                              min={0}
                              value={accommodationPrice || ""}
                              onChange={(e) => setAccommodationPrice(parseFloat(e.target.value) || 0)}
                              className="h-12 text-lg pl-14 font-sans tabular-nums bg-background/50 border-border/50 transition-all duration-200 focus:border-foreground/30 focus:bg-background"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-muted-foreground">
                            Nights
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            value={accommodationNights}
                            onChange={(e) => setAccommodationNights(parseInt(e.target.value) || 1)}
                            className="h-12 text-lg font-sans tabular-nums bg-background/50 border-border/50 transition-all duration-200 focus:border-foreground/30 focus:bg-background"
                          />
                        </div>
                      </div>
                      {accommodationPrice > 0 && (
                        <p className="text-sm text-muted-foreground">
                          CHF {pricePerNight.toFixed(2)} / night
                        </p>
                      )}
                      <div className="space-y-3 pt-2 border-t border-border/50">
                        <Label className="text-sm font-medium text-muted-foreground">
                          Booking Link
                        </Label>
                        <Input
                          placeholder="https://airbnb.com/rooms/..."
                          value={accommodationLink}
                          onChange={(e) => setAccommodationLink(e.target.value)}
                          className="h-10 text-sm bg-background/50 border-border/50 transition-all duration-200 focus:border-foreground/30 focus:bg-background"
                        />
                        {accommodationLink && (
                          <a
                            href={accommodationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                              <polyline points="15 3 21 3 21 9"/>
                              <line x1="10" x2="21" y1="14" y2="3"/>
                            </svg>
                            Open booking
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* BASIC INFO Section */}
            <div className="space-y-4">
              <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">Basic Info</h2>
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-black/5">
                <CardContent className="pt-6">
                  {basicInfo.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {basicInfo.map((field) => (
                        <div key={field.id} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-2">
                          <Input
                            placeholder="Label"
                            value={field.label}
                            onChange={(e) => updateBasicInfoField(field.id, "label", e.target.value)}
                            className="h-10 text-sm bg-background/50 border-border/50 w-32 flex-shrink-0"
                          />
                          <Input
                            placeholder="Info"
                            value={field.value}
                            onChange={(e) => updateBasicInfoField(field.id, "value", e.target.value)}
                            className="h-10 text-sm bg-background/50 border-border/50 flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeBasicInfoField(field.id)}
                            className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={addBasicInfoField}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14"/><path d="M5 12h14"/>
                    </svg>
                    Add info
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* EXPENSES Section */}
            <div className="space-y-4">
              <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">Expenses</h2>
              {/* Expense Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expenses.map((expense, index) => (
                <Card
                  key={expense.id}
                  className="border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-black/5 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                    <div className="flex-1 mr-4">
                      <input
                        type="text"
                        value={expense.name}
                        onChange={(e) => updateExpense(expense.id, "name", e.target.value)}
                        className="w-full bg-transparent border-0 p-0 text-2xl font-serif text-foreground focus:outline-none focus:ring-0 placeholder:text-muted-foreground/40 cursor-text"
                        placeholder="Expense Name"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExpense(expense.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors duration-200 -mr-2 -mt-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                      </svg>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">Amount</Label>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs transition-colors duration-200 ${!expense.isPerPerson ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                            Total
                          </span>
                          <Switch
                            checked={expense.isPerPerson}
                            onCheckedChange={(checked) => updateExpense(expense.id, "isPerPerson", checked)}
                            className="data-[state=checked]:bg-gold"
                          />
                          <span className={`text-xs transition-colors duration-200 ${expense.isPerPerson ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                            Per Person
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">CHF</span>
                        <Input
                          type="number"
                          min={0}
                          value={expense.price || ""}
                          onChange={(e) => updateExpense(expense.id, "price", parseFloat(e.target.value) || 0)}
                          className="pl-14 h-11 text-lg font-sans tabular-nums bg-background/50 border-border/50 transition-all duration-200 focus:border-foreground/30"
                          placeholder="0"
                        />
                      </div>
                      {expense.isPerPerson && expense.price > 0 && (
                        <p className="text-xs text-muted-foreground animate-in fade-in slide-in-from-top-1">
                          Total: <span className="font-sans tabular-nums">CHF {(expense.price * persons).toFixed(2)}</span>
                        </p>
                      )}
                    </div>

                    {/* Dynamic Info Fields */}
                    {expense.infoFields?.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {expense.infoFields?.map((field) => (
                          <div key={field.id} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-2">
                            <Input
                              placeholder="Label"
                              value={field.label}
                              onChange={(e) => updateInfoField(expense.id, field.id, "label", e.target.value)}
                              className="h-9 text-xs bg-background/50 border-border/50 w-24 flex-shrink-0"
                            />
                            <Input
                              placeholder="Value"
                              value={field.value}
                              onChange={(e) => updateInfoField(expense.id, field.id, "value", e.target.value)}
                              className="h-9 text-xs bg-background/50 border-border/50 flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => removeInfoField(expense.id, field.id)}
                              className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => addInfoField(expense.id)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14"/><path d="M5 12h14"/>
                      </svg>
                      Add info
                    </button>
                  </CardContent>
                </Card>
              ))}

              {/* Add Expense Card */}
              <Card
                onClick={addExpense}
                className="border-2 border-dashed border-border/50 bg-transparent hover:bg-card/30 hover:border-border cursor-pointer transition-all duration-300 flex items-center justify-center min-h-[200px]"
              >
                <div className="text-center text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-50">
                    <path d="M12 5v14"/><path d="M5 12h14"/>
                  </svg>
                  <p className="text-sm">Add Expense</p>
                </div>
              </Card>
            </div>
            </div>
          </div>

          {/* Right side - 1/3 width - The Bill */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 flex items-start lg:min-h-[calc(100vh-8rem)] lg:items-center">
              <Card ref={billRef} className="w-full border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-black/5">
                <CardHeader className="text-center pb-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Your Trip</p>
                  <CardTitle className="font-serif text-3xl lg:text-4xl">
                    {tripName || "Untitled Trip"}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {persons} {persons === 1 ? "traveler" : "travelers"}
                  </p>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Basic Info Section */}
                  {basicInfo.filter(f => f.label || f.value).length > 0 && (
                    <>
                      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">Basic Info</p>
                      <div className="space-y-1 mb-6">
                        {basicInfo.filter(f => f.label || f.value).map((field) => (
                          <div key={field.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{field.label || "Info"}</span>
                            <span>{field.value}</span>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-6" />
                    </>
                  )}

                  {/* Accommodation Section */}
                  {hasAccommodation && accommodationPrice > 0 && (
                    <>
                      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">Accommodation</p>
                      <div className="py-2 mb-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 mr-4">
                            <p className="text-sm">Stay</p>
                            <p className="text-xs text-muted-foreground">
                              {accommodationNights} {accommodationNights === 1 ? "night" : "nights"} × CHF {pricePerNight.toFixed(2)}
                            </p>
                          </div>
                          <span className="font-sans tabular-nums text-sm whitespace-nowrap">
                            <AnimatedNumber value={accommodationPrice} prefix="CHF " />
                          </span>
                        </div>
                      </div>
                      <Separator className="my-6" />
                    </>
                  )}

                  {/* Expenses Section */}
                  {expenses.length > 0 && (
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">Expenses</p>
                  )}
                  {expenses.length > 0 ? (
                    <div className="space-y-4 mb-6">
                      {expenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="py-2 transition-all duration-200 animate-in fade-in"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 mr-4">
                              <p className="text-sm">
                                {expense.name || "Unnamed"}
                              </p>
                              {expense.isPerPerson && (
                                <p className="text-xs text-muted-foreground">
                                  CHF {expense.price.toFixed(2)} × {persons}
                                </p>
                              )}
                            </div>
                            <span className="font-sans tabular-nums text-sm whitespace-nowrap">
                              <AnimatedNumber value={getExpenseTotal(expense)} prefix="CHF " />
                            </span>
                          </div>
                          {expense.infoFields?.filter(f => f.label || f.value).length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {expense.infoFields?.filter(f => f.label || f.value).map((field) => (
                                <p key={field.id} className="text-xs text-muted-foreground">
                                  {field.label && <span className="font-medium">{field.label}: </span>}
                                  <span className="italic">{field.value}</span>
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No expenses yet</p>
                      <p className="text-xs mt-1">Add your first expense to get started</p>
                    </div>
                  )}

                  <Separator className="my-6" />

                  {/* Totals */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-serif text-2xl tabular-nums">
                        <AnimatedNumber value={totalCost} prefix="CHF " />
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline">
                      <span className="text-muted-foreground">Per Person</span>
                      <span className="font-serif text-3xl lg:text-4xl tabular-nums text-gold">
                        <AnimatedNumber value={costPerPerson} prefix="CHF " />
                      </span>
                    </div>

                    {budgetPerPerson > 0 && (
                      <>
                        <Separator className="my-4" />
                        <div className="space-y-3 pt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Budget ({persons} × CHF {budgetPerPerson.toFixed(0)})
                            </span>
                            <span className="font-sans tabular-nums">
                              <AnimatedNumber value={totalBudget} prefix="CHF " />
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline">
                            <span className="text-muted-foreground">Remaining</span>
                            <span className={`font-serif text-xl tabular-nums transition-colors duration-300 ${
                              remaining < 0
                                ? "text-destructive"
                                : remaining < totalBudget * 0.2
                                  ? "text-yellow-500"
                                  : "text-emerald-500"
                            }`}>
                              <AnimatedNumber value={remaining} prefix="CHF " />
                            </span>
                          </div>
                          {/* Budget Progress Bar */}
                          <div className="h-2 bg-muted rounded-full overflow-hidden mt-4">
                            <div
                              className={`h-full transition-all duration-500 ease-out rounded-full ${
                                remaining < 0
                                  ? "bg-destructive"
                                  : remaining < totalBudget * 0.2
                                    ? "bg-yellow-500"
                                    : "bg-emerald-500"
                              }`}
                              style={{
                                width: `${Math.min((totalCost / totalBudget) * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Share/Download Actions or Footer */}
                  {expenses.length > 0 && (
                    <>
                      <Separator className="my-6" />
                      {isCapturing ? (
                        <p className="text-center text-xs text-muted-foreground pt-2">
                          Powered by Bros & Bills
                        </p>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copyToClipboard}
                            className="flex-1 text-xs"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                            </svg>
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadScreenshot}
                            disabled={isDownloading}
                            className="flex-1 text-xs"
                          >
                            {isDownloading ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 animate-spin">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" x2="12" y1="15" y2="3"/>
                              </svg>
                            )}
                            {isDownloading ? "Saving..." : "Download"}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
