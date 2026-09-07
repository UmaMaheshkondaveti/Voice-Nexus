import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, Volume2 } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { getBrandConfig, updateBrandConfig } from '../services/configService';
import type { BrandConfig } from '../types/config';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const [brand, setBrand] = useState<BrandConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { speak, isSupported } = useSpeechSynthesis();

  useEffect(() => {
    getBrandConfig().then(setBrand);
  }, []);

  async function handleSave() {
    if (!brand) return;
    setSaving(true);
    await updateBrandConfig(brand);
    setSaving(false);
    toast.push({ title: 'Brand settings saved', tone: 'success' });
  }

  if (!brand) {
    return (
      <div className="page">
        <Skeleton variant="line" width="240px" height="2rem" />
        <Skeleton variant="block" height={320} />
      </div>
    );
  }

  const previewGreeting = `Thanks for calling — you've reached ${brand.companyName || 'your company'}. How can I help you today?`;

  return (
    <div className="page">
      <PageHeader
        title="Settings"
        subtitle="VoiceNexus answers every call in your brand's voice, not a generic assistant's."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Administration' }, { label: 'Settings' }]}
        actions={
          <Button leftIcon={<Save size={14} />} onClick={handleSave} loading={saving}>
            Save changes
          </Button>
        }
      />

      <div className={styles.grid}>
        <Card title="Brand identity" subtitle="This name and mark replace 'VoiceNexus' in every caller-facing prompt">
          <div className={styles.identityRow}>
            <div className={styles.logoPreview} style={{ background: brand.brandColor }}>
              {brand.logoInitials || '??'}
            </div>
            <div className={styles.identityFields}>
              <label className={styles.field}>
                Company name
                <input type="text" value={brand.companyName} onChange={(e) => setBrand({ ...brand, companyName: e.target.value })} />
              </label>
              <label className={styles.field}>
                Logo initials <span className={styles.hint}>2–3 characters</span>
                <input
                  type="text"
                  maxLength={3}
                  value={brand.logoInitials}
                  onChange={(e) => setBrand({ ...brand, logoInitials: e.target.value.toUpperCase() })}
                />
              </label>
            </div>
          </div>

          <label className={styles.field}>
            Brand color
            <input type="color" value={brand.brandColor} onChange={(e) => setBrand({ ...brand, brandColor: e.target.value })} className={styles.colorInput} />
          </label>

          <label className={styles.field}>
            Tagline
            <input type="text" value={brand.tagline} onChange={(e) => setBrand({ ...brand, tagline: e.target.value })} />
          </label>

          <p className={styles.note}>
            The exact wording of greetings, hold messages, and disclosures is managed on the{' '}
            <Link to="/config/prompts">Prompts</Link> and <Link to="/config/voice">Voice &amp; AI</Link> pages — this brand
            identity is inserted into those templates automatically.
          </p>
        </Card>

        <Card title="Caller preview" subtitle="What a customer hears when they call">
          <div className={styles.previewCard}>
            <div className={styles.previewLogo} style={{ background: brand.brandColor }}>
              {brand.logoInitials || '??'}
            </div>
            <div>
              <p className={styles.previewCompany}>{brand.companyName || 'Your company'}</p>
              <p className={styles.previewTagline}>{brand.tagline}</p>
            </div>
          </div>
          <div className={styles.previewBubble}>{previewGreeting}</div>
          <Button variant="outline" leftIcon={<Volume2 size={14} />} onClick={() => speak(previewGreeting)} disabled={!isSupported}>
            Play greeting
          </Button>
        </Card>
      </div>
    </div>
  );
}
