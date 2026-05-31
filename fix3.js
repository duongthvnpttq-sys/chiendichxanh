const fs = require('fs');
let code = fs.readFileSync('src/components/assignments/UserAssignments.tsx', 'utf-8');

const lines = code.split('\n');
const fixedLines = [
  ...lines.slice(0, 1289),
  '                          </div>',
  '                          <div className="space-y-2">',
  '                            <label className="text-[10px] font-black uppercase text-slate-400">Dịch vụ áp dụng (Cách nhau dấu phẩy)</label>',
  '                            <Input ',
  '                              value={newCat.services}',
  '                              onChange={e => setNewCat({...newCat, services: e.target.value})}',
  '                              placeholder="VinaPhone, MyTV..." ',
  '                              className="rounded-xl"',
  '                            />',
  '                          </div>',
  '                        </div>',
  '                        <div className="flex justify-end gap-3 pt-2">',
  '                          <Button variant="ghost" className="rounded-xl font-bold uppercase text-[10px]" onClick={() => setAddCategoryDialogOpen(false)}>Hủy</Button>',
  '                          <Button className="bg-[#005BAA] rounded-xl font-bold uppercase text-[10px] px-8" onClick={handleCreateCategory}>',
  "                            {editingCategory ? 'Cập nhật' : 'Tạo chủ đề'}",
  '                          </Button>',
  '                        </div>',
  '                      </DialogContent>',
  '                    </Dialog>',
  '                  </AnimatePresence>',
  '                </div>',
  '                )}',
  '              </CardHeader>',
  '              <CardContent className="p-2 max-h-[600px] overflow-y-auto custom-scrollbar">',
  '                <div className="space-y-1">',
  ...lines.slice(1338)
];

fs.writeFileSync('src/components/assignments/UserAssignments.tsx', fixedLines.join('\n'));
console.log('Fixed using array split');
