/**
 * MSA (Metropolitan Statistical Area) Lookup
 *
 * Maps US county+state pairs to their MSA (CBSA) name.
 * Used by the geo breakdown to roll up sparse counties into metro areas.
 *
 * This covers the major MSAs where 8020REI clients operate.
 * Counties not in this map are grouped under their state name.
 *
 * Source: US Census Bureau CBSA delineation files.
 * Only markets relevant to real estate investors are included.
 */

// Key format: "County, ST" (e.g., "Cuyahoga, OH")
const MSA_MAP: Record<string, string> = {
  // Florida
  'Miami-Dade, FL': 'Miami-Fort Lauderdale, FL',
  'Broward, FL': 'Miami-Fort Lauderdale, FL',
  'Palm Beach, FL': 'Miami-Fort Lauderdale, FL',
  'Hillsborough, FL': 'Tampa-St. Petersburg, FL',
  'Pinellas, FL': 'Tampa-St. Petersburg, FL',
  'Pasco, FL': 'Tampa-St. Petersburg, FL',
  'Hernando, FL': 'Tampa-St. Petersburg, FL',
  'Polk, FL': 'Lakeland-Winter Haven, FL',
  'Orange, FL': 'Orlando, FL',
  'Seminole, FL': 'Orlando, FL',
  'Osceola, FL': 'Orlando, FL',
  'Lake, FL': 'Orlando, FL',
  'Volusia, FL': 'Deltona-Daytona Beach, FL',
  'Duval, FL': 'Jacksonville, FL',
  'St. Johns, FL': 'Jacksonville, FL',
  'Clay, FL': 'Jacksonville, FL',
  'Nassau, FL': 'Jacksonville, FL',
  'Lee, FL': 'Cape Coral-Fort Myers, FL',
  'Collier, FL': 'Naples, FL',
  'Brevard, FL': 'Palm Bay-Melbourne, FL',
  'Sarasota, FL': 'Sarasota-Bradenton, FL',
  'Manatee, FL': 'Sarasota-Bradenton, FL',
  'Escambia, FL': 'Pensacola, FL',
  'Santa Rosa, FL': 'Pensacola, FL',
  'Leon, FL': 'Tallahassee, FL',
  'Alachua, FL': 'Gainesville, FL',
  'Marion, FL': 'Ocala, FL',
  'St. Lucie, FL': 'Port St. Lucie, FL',
  'Martin, FL': 'Port St. Lucie, FL',
  'Indian River, FL': 'Sebastian-Vero Beach, FL',

  // Ohio
  'Cuyahoga, OH': 'Cleveland, OH',
  'Lake, OH': 'Cleveland, OH',
  'Lorain, OH': 'Cleveland, OH',
  'Medina, OH': 'Cleveland, OH',
  'Geauga, OH': 'Cleveland, OH',
  'Summit, OH': 'Akron, OH',
  'Portage, OH': 'Akron, OH',
  'Franklin, OH': 'Columbus, OH',
  'Delaware, OH': 'Columbus, OH',
  'Licking, OH': 'Columbus, OH',
  'Fairfield, OH': 'Columbus, OH',
  'Hamilton, OH': 'Cincinnati, OH',
  'Butler, OH': 'Cincinnati, OH',
  'Warren, OH': 'Cincinnati, OH',
  'Clermont, OH': 'Cincinnati, OH',
  'Montgomery, OH': 'Dayton, OH',
  'Greene, OH': 'Dayton, OH',
  'Lucas, OH': 'Toledo, OH',
  'Stark, OH': 'Canton, OH',
  'Mahoning, OH': 'Youngstown, OH',

  // Texas
  'Harris, TX': 'Houston, TX',
  'Fort Bend, TX': 'Houston, TX',
  'Montgomery, TX': 'Houston, TX',
  'Brazoria, TX': 'Houston, TX',
  'Galveston, TX': 'Houston, TX',
  'Dallas, TX': 'Dallas-Fort Worth, TX',
  'Tarrant, TX': 'Dallas-Fort Worth, TX',
  'Collin, TX': 'Dallas-Fort Worth, TX',
  'Denton, TX': 'Dallas-Fort Worth, TX',
  'Ellis, TX': 'Dallas-Fort Worth, TX',
  'Rockwall, TX': 'Dallas-Fort Worth, TX',
  'Bexar, TX': 'San Antonio, TX',
  'Travis, TX': 'Austin, TX',
  'Williamson, TX': 'Austin, TX',
  'Hays, TX': 'Austin, TX',
  'El Paso, TX': 'El Paso, TX',
  'Nueces, TX': 'Corpus Christi, TX',

  // California
  'Los Angeles, CA': 'Los Angeles, CA',
  'San Bernardino, CA': 'Riverside-San Bernardino, CA',
  'Riverside, CA': 'Riverside-San Bernardino, CA',
  'San Diego, CA': 'San Diego, CA',
  'Orange, CA': 'Los Angeles, CA',
  'Sacramento, CA': 'Sacramento, CA',
  'Alameda, CA': 'San Francisco-Oakland, CA',
  'San Francisco, CA': 'San Francisco-Oakland, CA',
  'Contra Costa, CA': 'San Francisco-Oakland, CA',
  'Santa Clara, CA': 'San Jose, CA',
  'Fresno, CA': 'Fresno, CA',
  'Kern, CA': 'Bakersfield, CA',
  'San Joaquin, CA': 'Stockton, CA',
  'Stanislaus, CA': 'Modesto, CA',

  // Nevada
  'Clark, NV': 'Las Vegas, NV',
  'Washoe, NV': 'Reno, NV',

  // Arizona
  'Maricopa, AZ': 'Phoenix, AZ',
  'Pima, AZ': 'Tucson, AZ',
  'Pinal, AZ': 'Phoenix, AZ',

  // Georgia
  'Fulton, GA': 'Atlanta, GA',
  'DeKalb, GA': 'Atlanta, GA',
  'Gwinnett, GA': 'Atlanta, GA',
  'Cobb, GA': 'Atlanta, GA',
  'Clayton, GA': 'Atlanta, GA',
  'Cherokee, GA': 'Atlanta, GA',
  'Forsyth, GA': 'Atlanta, GA',
  'Henry, GA': 'Atlanta, GA',
  'Douglas, GA': 'Atlanta, GA',
  'Chatham, GA': 'Savannah, GA',
  'Richmond, GA': 'Augusta, GA',

  // North Carolina
  'Mecklenburg, NC': 'Charlotte, NC',
  'Cabarrus, NC': 'Charlotte, NC',
  'Gaston, NC': 'Charlotte, NC',
  'Union, NC': 'Charlotte, NC',
  'Wake, NC': 'Raleigh, NC',
  'Durham, NC': 'Durham-Chapel Hill, NC',
  'Guilford, NC': 'Greensboro, NC',
  'Forsyth, NC': 'Winston-Salem, NC',
  'Cumberland, NC': 'Fayetteville, NC',
  'New Hanover, NC': 'Wilmington, NC',

  // South Carolina
  'Charleston, SC': 'Charleston, SC',
  'Greenville, SC': 'Greenville, SC',
  'Spartanburg, SC': 'Spartanburg, SC',
  'Richland, SC': 'Columbia, SC',
  'Lexington, SC': 'Columbia, SC',
  'Horry, SC': 'Myrtle Beach, SC',

  // Tennessee
  'Davidson, TN': 'Nashville, TN',
  'Rutherford, TN': 'Nashville, TN',
  'Williamson, TN': 'Nashville, TN',
  'Wilson, TN': 'Nashville, TN',
  'Sumner, TN': 'Nashville, TN',
  'Shelby, TN': 'Memphis, TN',
  'Knox, TN': 'Knoxville, TN',
  'Hamilton, TN': 'Chattanooga, TN',

  // Virginia
  'Fairfax, VA': 'Washington DC Metro',
  'Arlington, VA': 'Washington DC Metro',
  'Prince William, VA': 'Washington DC Metro',
  'Loudoun, VA': 'Washington DC Metro',
  'Virginia Beach city, VA': 'Virginia Beach-Norfolk, VA',
  'Norfolk city, VA': 'Virginia Beach-Norfolk, VA',
  'Chesapeake city, VA': 'Virginia Beach-Norfolk, VA',
  'Richmond city, VA': 'Richmond, VA',
  'Henrico, VA': 'Richmond, VA',
  'Chesterfield, VA': 'Richmond, VA',

  // Maryland
  'Baltimore, MD': 'Baltimore, MD',
  'Baltimore city, MD': 'Baltimore, MD',
  'Howard, MD': 'Baltimore, MD',
  'Anne Arundel, MD': 'Baltimore, MD',
  'Harford, MD': 'Baltimore, MD',
  'Montgomery, MD': 'Washington DC Metro',
  'Prince George\'s, MD': 'Washington DC Metro',

  // Pennsylvania
  'Philadelphia, PA': 'Philadelphia, PA',
  'Delaware, PA': 'Philadelphia, PA',
  'Chester, PA': 'Philadelphia, PA',
  'Montgomery, PA': 'Philadelphia, PA',
  'Bucks, PA': 'Philadelphia, PA',
  'Allegheny, PA': 'Pittsburgh, PA',
  'Westmoreland, PA': 'Pittsburgh, PA',
  'Lancaster, PA': 'Lancaster, PA',
  'Lehigh, PA': 'Allentown, PA',
  'Northampton, PA': 'Allentown, PA',

  // New Jersey
  'Bergen, NJ': 'New York Metro',
  'Essex, NJ': 'New York Metro',
  'Hudson, NJ': 'New York Metro',
  'Middlesex, NJ': 'New York Metro',
  'Passaic, NJ': 'New York Metro',
  'Union, NJ': 'New York Metro',
  'Camden, NJ': 'Philadelphia, PA',
  'Mercer, NJ': 'Trenton, NJ',
  'Monmouth, NJ': 'New York Metro',
  'Ocean, NJ': 'New York Metro',
  'Atlantic, NJ': 'Atlantic City, NJ',

  // New York
  'Kings, NY': 'New York Metro',
  'Queens, NY': 'New York Metro',
  'New York, NY': 'New York Metro',
  'Bronx, NY': 'New York Metro',
  'Richmond, NY': 'New York Metro',
  'Westchester, NY': 'New York Metro',
  'Nassau, NY': 'New York Metro',
  'Suffolk, NY': 'New York Metro',
  'Erie, NY': 'Buffalo, NY',
  'Monroe, NY': 'Rochester, NY',
  'Onondaga, NY': 'Syracuse, NY',
  'Albany, NY': 'Albany, NY',

  // Connecticut
  'Hartford, CT': 'Hartford, CT',
  'New Haven, CT': 'New Haven, CT',
  'Fairfield, CT': 'Bridgeport-Stamford, CT',

  // Massachusetts
  'Suffolk, MA': 'Boston, MA',
  'Middlesex, MA': 'Boston, MA',
  'Essex, MA': 'Boston, MA',
  'Norfolk, MA': 'Boston, MA',
  'Worcester, MA': 'Worcester, MA',
  'Hampden, MA': 'Springfield, MA',
  'Bristol, MA': 'Providence, RI',

  // Rhode Island
  'Providence, RI': 'Providence, RI',

  // Michigan
  'Wayne, MI': 'Detroit, MI',
  'Oakland, MI': 'Detroit, MI',
  'Macomb, MI': 'Detroit, MI',
  'Kent, MI': 'Grand Rapids, MI',
  'Washtenaw, MI': 'Ann Arbor, MI',
  'Genesee, MI': 'Flint, MI',
  'Ingham, MI': 'Lansing, MI',

  // Illinois
  'Cook, IL': 'Chicago, IL',
  'DuPage, IL': 'Chicago, IL',
  'Lake, IL': 'Chicago, IL',
  'Will, IL': 'Chicago, IL',
  'Kane, IL': 'Chicago, IL',
  'McHenry, IL': 'Chicago, IL',
  'Winnebago, IL': 'Rockford, IL',
  'Peoria, IL': 'Peoria, IL',
  'Sangamon, IL': 'Springfield, IL',
  'St. Clair, IL': 'St. Louis, MO',
  'Madison, IL': 'St. Louis, MO',

  // Missouri
  'St. Louis, MO': 'St. Louis, MO',
  'St. Louis city, MO': 'St. Louis, MO',
  'Jackson, MO': 'Kansas City, MO',
  'Clay, MO': 'Kansas City, MO',

  // Indiana
  'Marion, IN': 'Indianapolis, IN',
  'Hamilton, IN': 'Indianapolis, IN',
  'Hendricks, IN': 'Indianapolis, IN',
  'Allen, IN': 'Fort Wayne, IN',
  'Lake, IN': 'Chicago, IL',
  'St. Joseph, IN': 'South Bend, IN',

  // Wisconsin
  'Milwaukee, WI': 'Milwaukee, WI',
  'Waukesha, WI': 'Milwaukee, WI',
  'Dane, WI': 'Madison, WI',

  // Minnesota
  'Hennepin, MN': 'Minneapolis-St. Paul, MN',
  'Ramsey, MN': 'Minneapolis-St. Paul, MN',
  'Dakota, MN': 'Minneapolis-St. Paul, MN',
  'Anoka, MN': 'Minneapolis-St. Paul, MN',

  // Colorado
  'Denver, CO': 'Denver, CO',
  'Arapahoe, CO': 'Denver, CO',
  'Jefferson, CO': 'Denver, CO',
  'Adams, CO': 'Denver, CO',
  'Douglas, CO': 'Denver, CO',
  'El Paso, CO': 'Colorado Springs, CO',

  // Washington
  'King, WA': 'Seattle, WA',
  'Pierce, WA': 'Seattle, WA',
  'Snohomish, WA': 'Seattle, WA',
  'Spokane, WA': 'Spokane, WA',
  'Clark, WA': 'Portland, OR',

  // Oregon
  'Multnomah, OR': 'Portland, OR',
  'Washington, OR': 'Portland, OR',
  'Clackamas, OR': 'Portland, OR',

  // Alabama
  'Jefferson, AL': 'Birmingham, AL',
  'Shelby, AL': 'Birmingham, AL',
  'Madison, AL': 'Huntsville, AL',
  'Mobile, AL': 'Mobile, AL',
  'Montgomery, AL': 'Montgomery, AL',

  // Mississippi
  'Hinds, MS': 'Jackson, MS',
  'Harrison, MS': 'Gulfport-Biloxi, MS',

  // Louisiana
  'Orleans, LA': 'New Orleans, LA',
  'Jefferson, LA': 'New Orleans, LA',
  'East Baton Rouge, LA': 'Baton Rouge, LA',
  'Caddo, LA': 'Shreveport, LA',

  // Oklahoma
  'Oklahoma, OK': 'Oklahoma City, OK',
  'Tulsa, OK': 'Tulsa, OK',

  // Kansas
  'Johnson, KS': 'Kansas City, MO',
  'Sedgwick, KS': 'Wichita, KS',
  'Wyandotte, KS': 'Kansas City, MO',

  // Utah
  'Salt Lake, UT': 'Salt Lake City, UT',
  'Utah, UT': 'Provo-Orem, UT',
  'Davis, UT': 'Salt Lake City, UT',
  'Weber, UT': 'Ogden, UT',

  // Hawaii
  'Honolulu, HI': 'Honolulu, HI',

  // Iowa
  'Polk, IA': 'Des Moines, IA',
  'Linn, IA': 'Cedar Rapids, IA',

  // Nebraska
  'Douglas, NE': 'Omaha, NE',
  'Lancaster, NE': 'Lincoln, NE',

  // Arkansas
  'Pulaski, AR': 'Little Rock, AR',

  // Kentucky
  'Jefferson, KY': 'Louisville, KY',
  'Fayette, KY': 'Lexington, KY',

  // West Virginia
  'Kanawha, WV': 'Charleston, WV',
};

/**
 * Look up the MSA for a county+state pair.
 * Returns the MSA name or null if not in a mapped metro area.
 */
export function getMSA(county: string, state: string): string | null {
  // Try "County, ST" format (how Aurora data comes in)
  const key = `${county}, ${state}`;
  return MSA_MAP[key] ?? null;
}

/**
 * For geo breakdown, group county rows:
 * - Counties with clientCount >= threshold stay as county rows
 * - Others roll up to their MSA (or state if no MSA match)
 *
 * Returns rows with a `geoLabel` and `geoType` ('county' | 'msa') field.
 */
export interface GeoGroupedRow {
  geoLabel: string;
  geoType: 'county' | 'msa';
  state: string;
  totalMailed: number;
  leads: number;
  deals: number;
  totalRevenue: number;
}

export function groupByMSA(
  rows: Array<{ state: string; county: string; totalMailed: number; leads: number; deals: number; totalRevenue: number }>,
  countyThreshold = 3,
): GeoGroupedRow[] {
  // Count how many distinct domains (rows) per county to decide density
  const countyClientCount = new Map<string, number>();
  for (const r of rows) {
    const key = `${r.county}, ${r.state}`;
    countyClientCount.set(key, (countyClientCount.get(key) || 0) + 1);
  }

  const result: GeoGroupedRow[] = [];
  const msaAgg = new Map<string, GeoGroupedRow>();

  for (const r of rows) {
    const countyKey = `${r.county}, ${r.state}`;
    const clientCount = countyClientCount.get(countyKey) || 0;

    if (clientCount >= countyThreshold) {
      // Dense county — keep as its own row
      result.push({
        geoLabel: `${r.county} County`,
        geoType: 'county',
        state: r.state,
        totalMailed: r.totalMailed,
        leads: r.leads,
        deals: r.deals,
        totalRevenue: r.totalRevenue,
      });
    } else {
      // Sparse county — roll up to MSA
      const msa = getMSA(r.county, r.state);
      const groupKey = msa || `Other — ${r.state}`;

      const existing = msaAgg.get(groupKey);
      if (existing) {
        existing.totalMailed += r.totalMailed;
        existing.leads += r.leads;
        existing.deals += r.deals;
        existing.totalRevenue += r.totalRevenue;
      } else {
        msaAgg.set(groupKey, {
          geoLabel: groupKey,
          geoType: 'msa',
          state: r.state,
          totalMailed: r.totalMailed,
          leads: r.leads,
          deals: r.deals,
          totalRevenue: r.totalRevenue,
        });
      }
    }
  }

  // Merge aggregated MSA rows
  for (const agg of msaAgg.values()) {
    result.push(agg);
  }

  // Sort by leads DESC, then mailed DESC
  result.sort((a, b) => b.leads - a.leads || b.totalMailed - a.totalMailed);

  return result;
}
