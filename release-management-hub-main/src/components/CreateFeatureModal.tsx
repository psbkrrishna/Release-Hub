
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { Feature } from '@/types/Feature';

interface CreateFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feature: Omit<Feature, 'id'>) => void;
  editingFeature?: Feature | null;
}

const CreateFeatureModal = ({ isOpen, onClose, onSubmit, editingFeature }: CreateFeatureModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    productModule: '',
    releaseNotes: '',
    demoVideo: '',
    prodEnablementDate: '',
    deferrableTill: '',
    isEnabled: false,
    isPaid: false,
    status: 'Disabled' as 'Enabled' | 'Disabled' | 'Deferred',
    productGate: '',
    configurationDoc: '',
    featureType: 'Direct Enablement',
    featureTag: 'Enhancement' as 'Enhancement' | 'New Feature'
  });

  // Auto-calculate deferrable till date when prod enablement date changes
  useEffect(() => {
    if (formData.prodEnablementDate && formData.featureType !== 'Non Deferrable') {
      const prodDate = new Date(formData.prodEnablementDate);
      const deferrableDate = new Date(prodDate);
      deferrableDate.setDate(deferrableDate.getDate() + 90);
      
      setFormData(prev => ({
        ...prev,
        deferrableTill: deferrableDate.toISOString().split('T')[0]
      }));
    } else if (formData.featureType === 'Non Deferrable') {
      setFormData(prev => ({
        ...prev,
        deferrableTill: ''
      }));
    }
  }, [formData.prodEnablementDate, formData.featureType]);

  useEffect(() => {
    if (editingFeature) {
      setFormData({
        title: editingFeature.title,
        summary: editingFeature.summary || '',
        productModule: editingFeature.productModule,
        releaseNotes: editingFeature.releaseNotes,
        demoVideo: editingFeature.demoVideo || '',
        prodEnablementDate: editingFeature.prodEnablementDate,
        deferrableTill: editingFeature.deferrableTill || '',
        isEnabled: editingFeature.isEnabled,
        isPaid: editingFeature.isPaid || false,
        status: editingFeature.status,
        productGate: editingFeature.productGate || '',
        configurationDoc: editingFeature.configurationDoc || '',
        featureType: editingFeature.featureType || 'Direct Enablement',
        featureTag: editingFeature.featureTag
      });
    } else {
      setFormData({
        title: '',
        summary: '',
        productModule: '',
        releaseNotes: '',
        demoVideo: '',
        prodEnablementDate: '',
        deferrableTill: '',
        isEnabled: false,
        isPaid: false,
        status: 'Disabled' as 'Enabled' | 'Disabled' | 'Deferred',
        productGate: '',
        configurationDoc: '',
        featureType: 'Direct Enablement',
        featureTag: 'Enhancement' as 'Enhancement' | 'New Feature'
      });
    }
  }, [editingFeature, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for mandatory fields
    if (formData.featureType === 'Direct Enablement' && !formData.productGate.trim()) {
      alert('Product Gate is required for Direct Enablement features');
      return;
    }
    
    if (formData.featureType === 'Support Required' && !formData.configurationDoc.trim()) {
      alert('Configuration Document URL is required for Support Required features');
      return;
    }

    if (formData.featureType === 'Self Configurable' && !formData.configurationDoc.trim()) {
      alert('Configuration Document URL is required for Self Configurable features');
      return;
    }
    
    const supportNeeded = formData.featureType === 'Support Required';
    
    onSubmit({
      ...formData,
      supportNeeded,
      enablementDate: formData.prodEnablementDate,
      status: formData.isEnabled ? 'Enabled' : 'Disabled',
      featureTag: formData.featureTag as 'Enhancement' | 'New Feature',
      featureType: formData.featureType as 'Direct Enablement' | 'Non Deferrable' | 'Self Configurable' | 'Support Required'
    });
    
    // Reset form only if not editing
    if (!editingFeature) {
      setFormData({
        title: '',
        summary: '',
        productModule: '',
        releaseNotes: '',
        demoVideo: '',
        prodEnablementDate: '',
        deferrableTill: '',
        isEnabled: false,
        isPaid: false,
        status: 'Disabled' as 'Enabled' | 'Disabled' | 'Deferred',
        productGate: '',
        configurationDoc: '',
        featureType: 'Direct Enablement',
        featureTag: 'Enhancement' as 'Enhancement' | 'New Feature'
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingFeature ? 'Edit Feature' : 'Create New Feature'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Feature Title</Label>
              <Input 
                id="title" 
                name="title"
                value={formData.title} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="featureTag">Feature Tag</Label>
              <Select value={formData.featureTag} onValueChange={(value) => handleSelectChange('featureTag', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select feature tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Enhancement">Enhancement</SelectItem>
                  <SelectItem value="New Feature">New Feature</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Feature Summary</Label>
            <Textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              placeholder="Brief 2-line summary of the feature..."
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productModule">Product Module</Label>
              <Select value={formData.productModule} onValueChange={(value) => handleSelectChange('productModule', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Performance Management">Performance Management</SelectItem>
                  <SelectItem value="Recruiting">Recruiting</SelectItem>
                  <SelectItem value="Payroll">Payroll</SelectItem>
                  <SelectItem value="Benefits">Benefits</SelectItem>
                  <SelectItem value="Time Tracking">Time Tracking</SelectItem>
                  <SelectItem value="Learning">Learning</SelectItem>
                  <SelectItem value="Analytics">Analytics</SelectItem>
                  <SelectItem value="Employee Experience">Employee Experience</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="featureType">Feature Type</Label>
              <Select value={formData.featureType} onValueChange={(value) => handleSelectChange('featureType', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select feature type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direct Enablement">Direct Enablement</SelectItem>
                  <SelectItem value="Non Deferrable">Non Deferrable</SelectItem>
                  <SelectItem value="Self Configurable">Self Configurable</SelectItem>
                  <SelectItem value="Support Required">Support Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="releaseNotes">Release Notes URL</Label>
              <Input
                type="url"
                id="releaseNotes"
                name="releaseNotes"
                value={formData.releaseNotes}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="demoVideo">Demo Video URL</Label>
              <Input
                type="url"
                id="demoVideo"
                name="demoVideo"
                value={formData.demoVideo}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prodEnablementDate">Production Enablement Date</Label>
              <Input
                type="date"
                id="prodEnablementDate"
                name="prodEnablementDate"
                value={formData.prodEnablementDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deferrableTill">Deferrable Till Date</Label>
              <Input
                type="date"
                id="deferrableTill"
                name="deferrableTill"
                value={formData.deferrableTill}
                onChange={handleChange}
                placeholder={formData.featureType === 'Non Deferrable' ? 'Not applicable' : 'Auto-calculated as Prod Date + 90 days'}
                readOnly={formData.featureType !== 'Non Deferrable'}
                disabled={formData.featureType === 'Non Deferrable'}
                className={formData.featureType === 'Non Deferrable' ? 'bg-gray-100' : 'bg-gray-50'}
              />
              <p className="text-xs text-gray-500">
                {formData.featureType === 'Non Deferrable' 
                  ? 'Non-deferrable features cannot be deferred' 
                  : 'Auto-calculated as Production Enablement Date + 90 days'}
              </p>
            </div>
            <div></div> {/* Empty div for spacing */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productGate">
                Product Gate (Internal) 
                {formData.featureType === 'Direct Enablement' && <span className="text-red-500">*</span>}
              </Label>
              <Input
                type="text"
                id="productGate"
                name="productGate"
                value={formData.productGate}
                onChange={handleChange}
                placeholder={formData.featureType === 'Direct Enablement' ? 'Required' : 'Optional'}
                required={formData.featureType === 'Direct Enablement'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="configurationDoc">
                Configuration Document URL
                {(formData.featureType === 'Support Required' || formData.featureType === 'Self Configurable') && <span className="text-red-500">*</span>}
              </Label>
              <Input
                type="url"
                id="configurationDoc"
                name="configurationDoc"
                value={formData.configurationDoc}
                onChange={handleChange}
                placeholder={(formData.featureType === 'Support Required' || formData.featureType === 'Self Configurable') ? 'Required' : 'Optional'}
                required={formData.featureType === 'Support Required' || formData.featureType === 'Self Configurable'}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="isEnabled">Enabled</Label>
              <Switch
                id="isEnabled"
                checked={formData.isEnabled}
                onCheckedChange={(checked) => handleSwitchChange('isEnabled', checked)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="isPaid">Paid Feature</Label>
              <Switch
                id="isPaid"
                checked={formData.isPaid}
                onCheckedChange={(checked) => handleSwitchChange('isPaid', checked)}
              />
            </div>
          </div>

          <Button type="submit">{editingFeature ? 'Update Feature' : 'Create Feature'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFeatureModal;
