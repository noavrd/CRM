import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import { api } from "@/api/http";

type Suggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

export type AddressDetails = {
  placeId: string;
  formattedAddress: string;
  city: string;
  street: string;
  houseNumber: string;
  lat?: number;
  lng?: number;
};

type Props = {
  label?: string;
  fullWidth?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  onSelectAddress?: (addr: AddressDetails) => void;
};

export default function AddressAutocomplete({
  label = "כתובת",
  fullWidth = true,
  value,
  onChangeText,
  onSelectAddress,
}: Props) {
  const [input, setInput] = useState(value ?? "");
  const [options, setOptions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // לסנכרן value חיצוני אם יש
  useEffect(() => {
    if (value !== undefined && value !== input) {
      setInput(value);
    }
  }, [value]);

  // debounce קטן
  useEffect(() => {
    const q = input.trim();
    if (!q || q.length < 3) {
      setOptions([]);
      return;
    }

    const id = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api<Suggestion[]>(
          `/api/places/autocomplete?q=${encodeURIComponent(q)}`
        );
        setOptions(Array.isArray(res) ? res : []);
      } catch (e) {
        console.error("autocomplete error:", e);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(id);
  }, [input]);

  const handleInputChange = (_: any, newValue: string) => {
    setInput(newValue);
    onChangeText?.(newValue);
  };

  const handleSelect = async (_: any, option: Suggestion | null) => {
    if (!option) return;

    try {
      const details = await api<AddressDetails>(
        `/api/places/details?placeId=${encodeURIComponent(option.placeId)}`
      );
      onSelectAddress?.(details);
      setInput(details.formattedAddress || option.description);
    } catch (e) {
      console.error("details error:", e);
    }
  };

  return (
    <Autocomplete
      fullWidth={fullWidth}
      sx={{ width: "100%" }}
      options={options}
      getOptionLabel={(opt) => opt.description ?? ""}
      filterOptions={(x) => x} // לא לסנן שוב בצד הקליינט
      loading={loading}
      autoHighlight
      noOptionsText={
        input.length < 3 ? "יש להקליד לפחות 3 תווים" : "לא נמצאו כתובות"
      }
      onChange={handleSelect}
      inputValue={input}
      onInputChange={handleInputChange}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={18} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box
          component="li"
          {...props}
          sx={{ display: "flex", flexDirection: "column" }}
        >
          <Typography variant="body2" fontWeight={600}>
            {option.mainText}
          </Typography>
          {option.secondaryText && (
            <Typography variant="caption" color="text.secondary">
              {option.secondaryText}
            </Typography>
          )}
        </Box>
      )}
    />
  );
}
