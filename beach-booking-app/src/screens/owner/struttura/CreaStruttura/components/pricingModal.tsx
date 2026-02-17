import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Switch,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { PricingRules, PricingTimeSlot, DateOverride, PeriodOverride } from "../types/CreaStruttura.types";
import { styles } from "../styles/CreaStruttura.styles";

const DAYS_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

interface PricingModalProps {
  visible: boolean;
  pricing: PricingRules | null;
  onClose: () => void;
  onSave: () => void;
  setPricing: (pricing: PricingRules) => void;
  
  // Days Modal
  showDaysModal: boolean;
  setShowDaysModal: (show: boolean) => void;
  editingSlotIndex: number | null;
  
  // Date Picker
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  datePickerMode: "date" | "period-start" | "period-end";
  editingDateIndex: number | null;
  editingPeriodIndex: number | null;
  
  // Helper functions
  updateTempPricingFlat: (field: "oneHour" | "oneHourHalf", value: string) => void;
  updateTempPricingBase: (field: "oneHour" | "oneHourHalf", value: string) => void;
  toggleTempTimeSlot: () => void;
  addTempTimeSlot: () => void;
  updateTempTimeSlot: (index: number, field: string, value: any) => void;
  removeTempTimeSlot: (index: number) => void;
  openDaysModal: (slotIndex: number) => void;
  toggleDayInSlot: (dayIndex: number) => void;
  toggleTempDateOverrides: () => void;
  addTempDateOverride: () => void;
  updateTempDateOverride: (index: number, field: string, value: any) => void;
  removeTempDateOverride: (index: number) => void;
  openDatePicker: (index: number) => void;
  toggleTempPeriodOverrides: () => void;
  addTempPeriodOverride: () => void;
  updateTempPeriodOverride: (index: number, field: string, value: any) => void;
  removeTempPeriodOverride: (index: number) => void;
  openPeriodDatePicker: (periodIndex: number, mode: "period-start" | "period-end") => void;
  handleDateSelect: (dateStr: string) => void;
}

export default function PricingModal(props: PricingModalProps) {
  if (!props.visible || !props.pricing) return null;

  const renderDaysModal = () => (
    <Modal
      visible={props.showDaysModal}
      transparent
      animationType="slide"
      onRequestClose={() => props.setShowDaysModal(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => props.setShowDaysModal(false)}
      >
        <View style={styles.modalContentBottom} onStartShouldSetResponder={() => true}>
          <Text style={styles.modalTitle}>Seleziona Giorni</Text>
          <Text style={styles.modalDescription}>
            Lascia vuoto per applicare la fascia a tutti i giorni
          </Text>

          <View style={styles.daysGrid}>
            {DAYS_LABELS.map((day, index) => {
              const slot = props.pricing?.timeSlotPricing.slots[props.editingSlotIndex || 0];
              const isSelected = slot?.daysOfWeek?.includes(index) || false;

              return (
                <Pressable
                  key={index}
                  style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                  onPress={() => props.toggleDayInSlot(index)}
                >
                  <Text style={[styles.dayChipText, isSelected && styles.dayChipTextSelected]}>
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={styles.modalCloseButton}
            onPress={() => props.setShowDaysModal(false)}
          >
            <Text style={styles.modalCloseText}>Chiudi</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );

  const renderDatePickerModal = () => (
    <Modal
      visible={props.showDatePicker}
      transparent
      animationType="slide"
      onRequestClose={() => props.setShowDatePicker(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => props.setShowDatePicker(false)}
      >
        <View style={styles.modalContentBottom} onStartShouldSetResponder={() => true}>
          <Text style={styles.modalTitle}>Seleziona Data</Text>

          <View style={styles.calendarMonthSelector}>
            <Pressable
              style={styles.calendarMonthBtn}
              onPress={() => {
                const newDate = new Date(props.selectedMonth);
                newDate.setMonth(newDate.getMonth() - 1);
                props.setSelectedMonth(newDate);
              }}
            >
              <Ionicons name="chevron-back" size={24} color="#333" />
            </Pressable>

            <Text style={styles.calendarMonthText}>
              {props.selectedMonth.toLocaleDateString("it-IT", {
                month: "long",
                year: "numeric",
              })}
            </Text>

            <Pressable
              style={styles.calendarMonthBtn}
              onPress={() => {
                const newDate = new Date(props.selectedMonth);
                newDate.setMonth(newDate.getMonth() + 1);
                props.setSelectedMonth(newDate);
              }}
            >
              <Ionicons name="chevron-forward" size={24} color="#333" />
            </Pressable>
          </View>

          <View style={styles.calendarGrid}>
            <View style={styles.calendarWeekHeader}>
              {DAYS_LABELS.map((day) => (
                <Text key={day} style={styles.calendarWeekDay}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarDays}>
              {(() => {
                const year = props.selectedMonth.getFullYear();
                const month = props.selectedMonth.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();

                const days: any[] = [];

                for (let i = 0; i < firstDay; i++) {
                  days.push(<View key={`empty-${i}`} style={styles.calendarDayCell} />);
                }

                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
                    day
                  ).padStart(2, "0")}`;

                  days.push(
                    <Pressable
                      key={day}
                      style={styles.calendarDayCell}
                      onPress={() => props.handleDateSelect(dateStr)}
                    >
                      <View style={styles.calendarDayInner}>
                        <Text style={styles.calendarDayText}>{day}</Text>
                      </View>
                    </Pressable>
                  );
                }

                return days;
              })()}
            </View>
          </View>

          <Pressable
            style={styles.modalCloseButton}
            onPress={() => props.setShowDatePicker(false)}
          >
            <Text style={styles.modalCloseText}>Chiudi</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <>
      <Modal
        visible={props.visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f7f9" }}>
          <View style={styles.modalHeader}>
            <Pressable onPress={props.onClose}>
              <Ionicons name="close" size={28} color="#333" />
            </Pressable>
            <Text style={styles.modalHeaderTitle}>Configura Prezzi</Text>
            <Pressable onPress={props.onSave}>
              <Text style={styles.modalHeaderSave}>Salva</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {/* Mode Selection */}
            <View style={styles.modalCard}>
              <Text style={styles.modalCardTitle}>Modalità Pricing</Text>

              <Pressable
                style={[
                  styles.radioOption,
                  props.pricing.mode === "flat" && styles.radioOptionActive,
                ]}
                onPress={() => props.setPricing({ ...props.pricing!, mode: "flat" })}
              >
                <View style={styles.radioCircle}>
                  {props.pricing.mode === "flat" && <View style={styles.radioCircleInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.radioLabel}>Prezzo Fisso</Text>
                  <Text style={styles.radioDescription}>
                    Prezzi uguali per tutte le fasce orarie
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.radioOption,
                  props.pricing.mode === "advanced" && styles.radioOptionActive,
                ]}
                onPress={() => props.setPricing({ ...props.pricing!, mode: "advanced" })}
              >
                <View style={styles.radioCircle}>
                  {props.pricing.mode === "advanced" && <View style={styles.radioCircleInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.radioLabel}>Pricing Dinamico</Text>
                  <Text style={styles.radioDescription}>
                    Prezzi variabili per fascia oraria
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Flat Prices */}
            {props.pricing.mode === "flat" && (
              <View style={styles.modalCard}>
                <Text style={styles.modalCardTitle}>💵 Prezzi Fissi</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>1 ora</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.euroSign}>€</Text>
                    <TextInput
                      style={styles.priceInputField}
                      value={props.pricing.flatPrices.oneHour.toString()}
                      onChangeText={(v) => props.updateTempPricingFlat("oneHour", v)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>1.5 ore</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.euroSign}>€</Text>
                    <TextInput
                      style={styles.priceInputField}
                      value={props.pricing.flatPrices.oneHourHalf.toString()}
                      onChangeText={(v) => props.updateTempPricingFlat("oneHourHalf", v)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Advanced Mode */}
            {props.pricing.mode === "advanced" && (
              <>
                {/* Base Prices */}
                <View style={styles.modalCard}>
                  <Text style={styles.modalCardTitle}>💵 Prezzi Base</Text>
                  <Text style={styles.cardDescription}>
                    Usati quando non c'è una fascia oraria specifica
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>1 ora</Text>
                    <View style={styles.priceInputContainer}>
                      <Text style={styles.euroSign}>€</Text>
                      <TextInput
                        style={styles.priceInputField}
                        value={props.pricing.basePrices.oneHour.toString()}
                        onChangeText={(v) => props.updateTempPricingBase("oneHour", v)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>1.5 ore</Text>
                    <View style={styles.priceInputContainer}>
                      <Text style={styles.euroSign}>€</Text>
                      <TextInput
                        style={styles.priceInputField}
                        value={props.pricing.basePrices.oneHourHalf.toString()}
                        onChangeText={(v) => props.updateTempPricingBase("oneHourHalf", v)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                </View>

                {/* Time Slots */}
                <View style={styles.modalCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.modalCardTitle}>⏰ Fasce Orarie</Text>
                    <Switch
                      value={props.pricing.timeSlotPricing.enabled}
                      onValueChange={props.toggleTempTimeSlot}
                    />
                  </View>

                  {props.pricing.timeSlotPricing.enabled && (
                    <>
                      {props.pricing.timeSlotPricing.slots.map((slot, index) => (
                        <View key={index} style={styles.timeSlotCard}>
                          <View style={styles.timeSlotHeader}>
                            <TextInput
                              style={styles.timeSlotLabelInput}
                              value={slot.label}
                              onChangeText={(v) => props.updateTempTimeSlot(index, "label", v)}
                              placeholder="Nome fascia"
                            />
                            <Pressable onPress={() => props.removeTempTimeSlot(index)}>
                              <Ionicons name="trash-outline" size={20} color="#E53935" />
                            </Pressable>
                          </View>

                          <View style={styles.timeSlotTimeRow}>
                            <View style={styles.timeInputWrapper}>
                              <Text style={styles.timeLabel}>Inizio</Text>
                              <TextInput
                                style={styles.timeInputModal}
                                value={slot.start}
                                onChangeText={(v) => props.updateTempTimeSlot(index, "start", v)}
                                placeholder="09:00"
                              />
                            </View>

                            <View style={styles.timeInputWrapper}>
                              <Text style={styles.timeLabel}>Fine</Text>
                              <TextInput
                                style={styles.timeInputModal}
                                value={slot.end}
                                onChangeText={(v) => props.updateTempTimeSlot(index, "end", v)}
                                placeholder="13:00"
                              />
                            </View>
                          </View>

                          <Pressable
                            style={styles.daysSelector}
                            onPress={() => props.openDaysModal(index)}
                          >
                            <Text style={styles.daysSelectorText}>
                              {slot.daysOfWeek && slot.daysOfWeek.length > 0
                                ? slot.daysOfWeek.map((d) => DAYS_LABELS[d]).join(", ")
                                : "Tutti i giorni"}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="#666" />
                          </Pressable>

                          <View style={styles.slotPriceRow}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                              <Text style={styles.slotPriceLabel}>1h</Text>
                              <View style={styles.priceInputContainer}>
                                <Text style={styles.euroSign}>€</Text>
                                <TextInput
                                  style={styles.priceInputField}
                                  value={slot.prices.oneHour.toString()}
                                  onChangeText={(v) =>
                                    props.updateTempTimeSlot(index, "prices.oneHour", v)
                                  }
                                  keyboardType="decimal-pad"
                                />
                              </View>
                            </View>

                            <View style={{ flex: 1, marginLeft: 8 }}>
                              <Text style={styles.slotPriceLabel}>1.5h</Text>
                              <View style={styles.priceInputContainer}>
                                <Text style={styles.euroSign}>€</Text>
                                <TextInput
                                  style={styles.priceInputField}
                                  value={slot.prices.oneHourHalf.toString()}
                                  onChangeText={(v) =>
                                    props.updateTempTimeSlot(index, "prices.oneHourHalf", v)
                                  }
                                  keyboardType="decimal-pad"
                                />
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}

                      <Pressable style={styles.addButton} onPress={props.addTempTimeSlot}>
                        <Ionicons name="add-circle" size={18} color="#2196F3" />
                        <Text style={styles.addButtonText}>Aggiungi fascia</Text>
                      </Pressable>
                    </>
                  )}
                </View>

                {/* Date Overrides */}
                <View style={styles.modalCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.modalCardTitle}>📅 Date Specifiche</Text>
                    <Switch
                      value={props.pricing.dateOverrides.enabled}
                      onValueChange={props.toggleTempDateOverrides}
                    />
                  </View>

                  {props.pricing.dateOverrides.enabled && (
                    <>
                      {props.pricing.dateOverrides.dates.map((dateOvr, index) => (
                        <View key={index} style={styles.timeSlotCard}>
                          <View style={styles.timeSlotHeader}>
                            <TextInput
                              style={styles.timeSlotLabelInput}
                              value={dateOvr.label}
                              onChangeText={(v) => props.updateTempDateOverride(index, "label", v)}
                              placeholder="Es: Natale"
                            />
                            <Pressable onPress={() => props.removeTempDateOverride(index)}>
                              <Ionicons name="trash-outline" size={20} color="#E53935" />
                            </Pressable>
                          </View>

                          <Pressable
                            style={styles.dateInputPressable}
                            onPress={() => props.openDatePicker(index)}
                          >
                            <Text style={styles.dateInputText}>{dateOvr.date}</Text>
                            <Ionicons name="calendar-outline" size={16} color="#2196F3" />
                          </Pressable>

                          <View style={styles.slotPriceRow}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                              <Text style={styles.slotPriceLabel}>1h</Text>
                              <View style={styles.priceInputContainer}>
                                <Text style={styles.euroSign}>€</Text>
                                <TextInput
                                  style={styles.priceInputField}
                                  value={dateOvr.prices.oneHour.toString()}
                                  onChangeText={(v) =>
                                    props.updateTempDateOverride(index, "prices.oneHour", v)
                                  }
                                  keyboardType="decimal-pad"
                                />
                              </View>
                            </View>

                            <View style={{ flex: 1, marginLeft: 8 }}>
                              <Text style={styles.slotPriceLabel}>1.5h</Text>
                              <View style={styles.priceInputContainer}>
                                <Text style={styles.euroSign}>€</Text>
                                <TextInput
                                  style={styles.priceInputField}
                                  value={dateOvr.prices.oneHourHalf.toString()}
                                  onChangeText={(v) =>
                                    props.updateTempDateOverride(index, "prices.oneHourHalf", v)
                                  }
                                  keyboardType="decimal-pad"
                                />
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}

                      <Pressable style={styles.addButton} onPress={props.addTempDateOverride}>
                        <Ionicons name="add-circle" size={18} color="#2196F3" />
                        <Text style={styles.addButtonText}>Aggiungi data</Text>
                      </Pressable>
                    </>
                  )}
                </View>

                {/* Period Overrides */}
                <View style={styles.modalCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.modalCardTitle}>📆 Periodi</Text>
                    <Switch
                      value={props.pricing.periodOverrides.enabled}
                      onValueChange={props.toggleTempPeriodOverrides}
                    />
                  </View>

                  {props.pricing.periodOverrides.enabled && (
                    <>
                      {props.pricing.periodOverrides.periods.map((period, index) => (
                        <View key={index} style={styles.timeSlotCard}>
                          <View style={styles.timeSlotHeader}>
                            <TextInput
                              style={styles.timeSlotLabelInput}
                              value={period.label}
                              onChangeText={(v) => props.updateTempPeriodOverride(index, "label", v)}
                              placeholder="Es: Alta stagione"
                            />
                            <Pressable onPress={() => props.removeTempPeriodOverride(index)}>
                              <Ionicons name="trash-outline" size={20} color="#E53935" />
                            </Pressable>
                          </View>

                          <View style={styles.periodDatesRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.dateLabel}>Dal</Text>
                              <Pressable
                                style={styles.dateInputPressable}
                                onPress={() => props.openPeriodDatePicker(index, "period-start")}
                              >
                                <Text style={styles.dateInputText}>{period.startDate}</Text>
                                <Ionicons name="calendar-outline" size={16} color="#2196F3" />
                              </Pressable>
                            </View>

                            <View style={{ flex: 1, marginLeft: 8 }}>
                              <Text style={styles.dateLabel}>Al</Text>
                              <Pressable
                                style={styles.dateInputPressable}
                                onPress={() => props.openPeriodDatePicker(index, "period-end")}
                              >
                                <Text style={styles.dateInputText}>{period.endDate}</Text>
                                <Ionicons name="calendar-outline" size={16} color="#2196F3" />
                              </Pressable>
                            </View>
                          </View>

                          <View style={styles.slotPriceRow}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                              <Text style={styles.slotPriceLabel}>1h</Text>
                              <View style={styles.priceInputContainer}>
                                <Text style={styles.euroSign}>€</Text>
                                <TextInput
                                  style={styles.priceInputField}
                                  value={period.prices.oneHour.toString()}
                                  onChangeText={(v) =>
                                    props.updateTempPeriodOverride(index, "prices.oneHour", v)
                                  }
                                  keyboardType="decimal-pad"
                                />
                              </View>
                            </View>

                            <View style={{ flex: 1, marginLeft: 8 }}>
                              <Text style={styles.slotPriceLabel}>1.5h</Text>
                              <View style={styles.priceInputContainer}>
                                <Text style={styles.euroSign}>€</Text>
                                <TextInput
                                  style={styles.priceInputField}
                                  value={period.prices.oneHourHalf.toString()}
                                  onChangeText={(v) =>
                                    props.updateTempPeriodOverride(index, "prices.oneHourHalf", v)
                                  }
                                  keyboardType="decimal-pad"
                                />
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}

                      <Pressable style={styles.addButton} onPress={props.addTempPeriodOverride}>
                        <Ionicons name="add-circle" size={18} color="#2196F3" />
                        <Text style={styles.addButtonText}>Aggiungi periodo</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {renderDaysModal()}
      {renderDatePickerModal()}
    </>
  );
}