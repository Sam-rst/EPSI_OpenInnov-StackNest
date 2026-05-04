import { Avatar, Button, Card } from '@core/ui';
import { SField } from '../forms/SField';
import { SInput } from '../forms/SInput';
import { SettingRow } from '../forms/SettingRow';

const ProfileInformation = () => (
  <Card className="p-6">
    <h2 className="text-[15px] font-semibold mb-1 text-text-primary">Informations personnelles</h2>
    <p className="text-[12.5px] mb-5 text-text-muted">Visibles par les membres de ton workspace.</p>
    <div className="flex items-center gap-5 mb-5">
      <Avatar name="Yassine Zouitni" color="#fea21f" size={64} />
      <div>
        <Button variant="secondary" size="sm" icon="upload">Changer la photo</Button>
        <div className="text-[11px] mt-1.5 text-text-muted">JPG ou PNG · max 2 MB</div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <SField label="Nom complet"><SInput defaultValue="Yassine Zouitni" /></SField>
      <SField label="Email pro"><SInput defaultValue="yassine.zouitni@stacknest.dev" /></SField>
      <SField label="Rôle dans l'équipe"><SInput defaultValue="Owner / Plateforme" /></SField>
      <SField label="Fuseau horaire"><SInput defaultValue="Europe/Paris (UTC+1)" /></SField>
    </div>
    <div className="mt-5 flex justify-end gap-2">
      <Button variant="ghost">Annuler</Button>
      <Button variant="primary">Enregistrer</Button>
    </div>
  </Card>
);

const InterfacePrefs = () => (
  <Card className="p-6">
    <h2 className="text-[15px] font-semibold mb-1 text-text-primary">Préférences d'interface</h2>
    <p className="text-[12.5px] mb-5 text-text-muted">Comment tu vois StackNest.</p>
    <SettingRow label="Thème automatique" hint="Suit le réglage système" defaultOn={false} />
    <SettingRow label="Notifications de déploiement" hint="Email + in-app à la fin de chaque run" defaultOn={true} />
    <SettingRow label="Animations réduites" hint="Limite les transitions et auto-anims" defaultOn={false} />
  </Card>
);

export function ProfileTab() {
  return (
    <>
      <ProfileInformation />
      <InterfacePrefs />
    </>
  );
}
