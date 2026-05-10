const fs = require('fs');
const path = './client/src/components/dialogs/medication-dialog.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetContent = `<Popover open={medicationOpen} onOpenChange={setMedicationOpen} modal={false}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={medicationOpen}
                                                className={cn(
                                                    "w-full justify-between font-normal h-10",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                <span className="flex-1 flex items-center gap-2">
                                                    {field.value || "Selecione o medicamento"}
                                                    {(() => {
                                                        const val = (field.value || "").toLowerCase().trim();
                                                        const isStandard = ALL_MEDICATIONS_WITH_PRESENTATIONS.some(
                                                            m => m.displayName.toLowerCase() === val || m.baseName.toLowerCase() === val
                                                        );
                                                        const isCustom = customMedications.some(m => m.name.toLowerCase() === val) || !isStandard;

                                                        if (isCustom && val) {
                                                            return (
                                                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-200 text-blue-600 bg-blue-50">
                                                                    Personalizado
                                                                </Badge>
                                                            );
                                                        }

                                                        if (selectedMedInfo?.prescriptionType && (selectedMedInfo.prescriptionType as string) !== 'common' && (selectedMedInfo.prescriptionType as string) !== 'padrao') {
                                                            return <PrescriptionTypeBadge type={selectedMedInfo.prescriptionType} />;
                                                        }
                                                        return null;
                                                    })()}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-[400px] p-0 z-[9999]"
                                            align="start"
                                            onOpenAutoFocus={(e) => e.preventDefault()}
                                        >`;

const replaceContent = `<div className="relative w-full">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={medicationOpen}
                                            onClick={() => setMedicationOpen(!medicationOpen)}
                                            className={cn(
                                                "w-full justify-between font-normal h-10",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            <span className="flex-1 flex items-center gap-2">
                                                {field.value || "Selecione o medicamento"}
                                                {(() => {
                                                    const val = (field.value || "").toLowerCase().trim();
                                                    const isStandard = ALL_MEDICATIONS_WITH_PRESENTATIONS.some(
                                                        m => m.displayName.toLowerCase() === val || m.baseName.toLowerCase() === val
                                                    );
                                                    const isCustom = customMedications.some(m => m.name.toLowerCase() === val) || !isStandard;

                                                    if (isCustom && val) {
                                                        return (
                                                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-200 text-blue-600 bg-blue-50">
                                                                Personalizado
                                                            </Badge>
                                                        );
                                                    }

                                                    if (selectedMedInfo?.prescriptionType && (selectedMedInfo.prescriptionType as string) !== 'common' && (selectedMedInfo.prescriptionType as string) !== 'padrao') {
                                                        return <PrescriptionTypeBadge type={selectedMedInfo.prescriptionType} />;
                                                    }
                                                    return null;
                                                })()}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                        {medicationOpen && (
                                            <div 
                                                className="absolute left-0 right-0 mt-1 rounded-md border shadow-md overflow-hidden flex flex-col z-[99999]"
                                                style={{ top: '100%', backgroundColor: 'white' }}
                                            >`;

const targetEnd = `                                        </PopoverContent>
                                    </Popover>`;
const replaceEnd = `                                            </div>
                                        )}
                                    </div>`;

if (!content.includes(targetContent)) {
    console.log("Could not find start target content");
    process.exit(1);
}
if (!content.includes(targetEnd)) {
    console.log("Could not find end target content");
    process.exit(1);
}

content = content.replace(targetContent, replaceContent);
content = content.replace(targetEnd, replaceEnd);
fs.writeFileSync(path, content);
console.log("Replaced successfully!");
