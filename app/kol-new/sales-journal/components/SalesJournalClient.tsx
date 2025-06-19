"use client";

import { useState, useEffect } from 'react';
import { JournalEntryData } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import JournalList from './JournalList';
import JournalForm from './JournalForm';
import { Card } from '@/components/ui/card';


interface Props {
    kolId: number;
    initialEntries: JournalEntryData[];
    initialManagedShops: string[];
    initialShopSpecialNotes: Record<string, string>;
}

export default function SalesJournalClient({ 
    kolId,
    initialEntries,
    initialManagedShops,
    initialShopSpecialNotes
 }: Props) {
    const [entries, setEntries] = useState<JournalEntryData[]>(initialEntries);
    const [managedShops, setManagedShops] = useState<string[]>(initialManagedShops);
    const [shopSpecialNotes, setShopSpecialNotes] = useState<Record<string, string>>(initialShopSpecialNotes);
    const [showForm, setShowForm] = useState(false);

    // 나중에 localstorage 연동을 위해 useEffect 사용
    useEffect(() => {
        // console.log("Entries updated:", entries);
    }, [entries]);

    const handleAddJournal = () => {
        setShowForm(true);
    };
    
    const handleCancelForm = () => {
        setShowForm(false);
    }
    
    const handleSaveJournal = (newEntryData: Omit<JournalEntryData, 'id' | 'createdAt'>) => {
        const currentTime = new Date();
        const existingEntryIndex = entries.findIndex(
            entry => entry.date === newEntryData.date && entry.shopName === newEntryData.shopName
        );

        if (existingEntryIndex >= 0) {
            // 기존 일지에 내용 추가
             setEntries(prev =>
                prev.map((entry, index) => {
                    if (index === existingEntryIndex) {
                        const separator = entry.content ? '\n' : '';
                        const updatedContent = entry.content +
                            separator +
                            `* [${currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}] ${newEntryData.content}`;
                        
                        return {
                            ...entry,
                            content: updatedContent,
                            updatedAt: currentTime.getTime()
                        };
                    }
                    return entry;
                })
            );

        } else {
            // 새로운 일지 생성
            const newEntry: JournalEntryData = {
                id: currentTime.getTime().toString() + Math.random().toString(36).substr(2, 9),
                ...newEntryData,
                createdAt: currentTime.getTime()
            };
            setEntries(prev => [newEntry, ...prev]);
        }
        setShowForm(false);
    }

    const handleDeleteJournal = (id: string) => {
        setEntries(prev => prev.filter(entry => entry.id !== id));
    }

    const handleUpdateJournal = (id: string, content: string, shopName: string) => {
        setEntries(prev => prev.map(entry => 
            entry.id === id ? { ...entry, content, shopName, updatedAt: Date.now() } : entry
        ));
    };

    const handleAddShop = (newShop: string) => {
        if (newShop.trim() && !managedShops.includes(newShop.trim())) {
            const newShopTrimmed = newShop.trim();
            setManagedShops(prev => [...prev, newShopTrimmed]);
            setShopSpecialNotes(prev => ({ ...prev, [newShopTrimmed]: '' }));
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* 헤더 */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4">
                <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/kol-new/customer-manager">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        고객 관리로
                      </Link>
                    </Button>
                    <h1 className="text-lg font-semibold">영업 일지</h1>
                    <Button
                        onClick={handleAddJournal}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        size="sm"
                        disabled={showForm}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        새 글 추가
                    </Button>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* 새 일지 추가 폼 */}
                {showForm && (
                     <JournalForm 
                        managedShops={managedShops}
                        shopSpecialNotes={shopSpecialNotes}
                        onSave={handleSaveJournal}
                        onCancel={handleCancelForm}
                        onAddShop={handleAddShop}
                     />
                )}

                {/* 일지 목록 */}
                {entries.length > 0 ? (
                    <JournalList 
                        entries={entries} 
                        managedShops={managedShops}
                        shopSpecialNotes={shopSpecialNotes}
                        onUpdate={handleUpdateJournal}
                        onDelete={handleDeleteJournal}
                        onAddShop={handleAddShop}
                    />
                ) : !showForm ? (
                    <Card 
                        className="p-8 text-center cursor-pointer hover:bg-muted/20 transition-colors rounded-lg border-dashed"
                        onClick={handleAddJournal}
                    >
                        <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-lg flex items-center justify-center">
                            <Plus className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-muted-foreground font-semibold mb-2">영업일지를 추가해주세요</h3>
                        <p className="text-sm text-muted-foreground">
                            상단의 '새 글 추가' 버튼을 사용해서 첫 번째 일지를 등록해보세요
                        </p>
                    </Card>
                ) : null}
            </div>
        </div>
    );
} 