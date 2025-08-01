"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/useTranslation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AccountSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, setLanguage, currentLang, supportedLanguages } = useTranslation();
  const [username, setUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const updateData: { username?: string; password?: string; oldPassword?: string } = {};
      if (username.trim() && username.trim() !== user.username) updateData.username = username.trim();

      // If either password field is filled, treat as password change
      const wantsToChangePassword = password.length > 0 || oldPassword.length > 0;
      if (wantsToChangePassword) {
        if (password.length < 6) {
          toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
          setLoading(false);
          return;
        }
        if (!user.isAdmin && !oldPassword) {
          toast({ title: "Error", description: "Please enter your old password to set a new one.", variant: "destructive" });
          setLoading(false);
          return;
        }
        updateData.password = password;
        if (!user.isAdmin) {
          updateData.oldPassword = oldPassword;
        }
      }

      if (Object.keys(updateData).length > 0) {
        const res = await fetch("/api/users/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId: user.id, ...updateData }),
        });
        if (res.ok) {
          toast({ title: "Success", description: "Account updated." });
          setPassword("");
          setOldPassword("");
        } else {
          const data = await res.json();
          throw new Error(data.error || "Failed to update");
        }
      } else {
        toast({ title: "Info", description: "No changes to save.", variant: "default" });
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to update", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    toast({
      title: t('success'),
      description: t('language_changed'),
    });
    // Force reload component to apply new language
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleUpdate} className="space-y-4 py-2">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t('username')}</Label>
            <Input 
              id="username" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              disabled={loading} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="old-password">{t('old_password')}</Label>
            <Input 
              id="old-password" 
              type="password" 
              value={oldPassword} 
              onChange={e => setOldPassword(e.target.value)} 
              disabled={loading} 
              placeholder={t('enter_old_password_to_change')} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">{t('new_password')}</Label>
            <Input 
              id="new-password" 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              minLength={6} 
              disabled={loading} 
              placeholder={t('leave_blank_to_keep_current_password')} 
            />
          </div>

          <div className="space-y-2">
            <Label>{t('language_settings')}</Label>
            <Select value={currentLang} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('select_language')} />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.display}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={loading || (!username.trim() && !password && !oldPassword)} 
            className="w-full"
          >
            {loading ? t('saving') : t('save_changes')}
          </Button>
        </div>
      </form>
    </div>
  );
}